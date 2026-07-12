import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_CENTER = [39.9042, 116.4074]; // 北京天安门

function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) return resolve(window.L);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

// 高德正向地理编码：地址 → 多个候选坐标
async function geocode(address) {
  if (!address || !address.trim()) return [];
  try {
    const res = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?key=4a26f56e4e5b1e3c7d8f9a0b1c2d3e4f&address=${encodeURIComponent(address)}&output=json`
    );
    const data = await res.json();
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      return data.geocodes.map(g => {
        const [lng, lat] = g.location.split(',').map(Number);
        return {
          lat,
          lng,
          name: g.name || '',
          address: g.formatted_address || g.name || '',
          city: g.city || '',
          district: g.district || '',
        };
      });
    }
  } catch (e) {
    // 地理编码失败
  }
  return [];
}

function MapPicker({ value, onChange, locationText = '', height = '300px' }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [address, setAddress] = useState('');
  const [candidates, setCandidates] = useState([]); // 地址候选列表
  const [showCandidates, setShowCandidates] = useState(false);
  const [searching, setSearching] = useState(false);
  const geocodeTimer = useRef(null);
  const geocodedRef = useRef('');

  // 通过高德逆地理编码获取地址
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?key=4a26f56e4e5b1e3c7d8f9a0b1c2d3e4f&location=${lng},${lat}&radius=1000&extensions=base`
      );
      const data = await res.json();
      if (data.status === '1' && data.regeocode) {
        return data.regeocode.formatted_address || '';
      }
    } catch (e) {
      // 逆地理编码失败
    }
    return '';
  }, []);

  // 放置标记到地图上
  const placeMarker = useCallback((lat, lng) => {
    if (!mapInstance.current) return;
    const L = window.L;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstance.current);
      markerRef.current = marker;
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng).then((addr) => {
          if (addr) setAddress(addr);
        });
      });
    }
    mapInstance.current.setView([lat, lng], 14);
    onChange({ lat, lng });
    reverseGeocode(lat, lng).then((addr) => {
      if (addr) setAddress(addr);
    });
  }, [onChange, reverseGeocode]);

  // 初始化地图
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled) return;

      const container = mapRef.current;
      if (!container || mapInstance.current) return;

      const initialCenter = value
        ? [value.lat, value.lng]
        : DEFAULT_CENTER;

      const map = L.map(container, {
        center: initialCenter,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // 如果有初始值，放置标记
      if (value && value.lat && value.lng) {
        const marker = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);
        markerRef.current = marker;
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const newVal = { lat: pos.lat, lng: pos.lng };
          onChange(newVal);
          reverseGeocode(pos.lat, pos.lng).then((addr) => {
            if (addr) setAddress(addr);
          });
        });
      }

      // 点击地图放置/移动标记
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        const newVal = { lat, lng };
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          markerRef.current = marker;
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange({ lat: pos.lat, lng: pos.lng });
            reverseGeocode(pos.lat, pos.lng).then((addr) => {
              if (addr) setAddress(addr);
            });
          });
        }
        onChange(newVal);
        const addr = await reverseGeocode(lat, lng);
        if (addr) setAddress(addr);
      });

      mapInstance.current = map;
      setReady(true);

      // 初始化时如果有值，立即获取地址
      if (value && value.lat && value.lng) {
        reverseGeocode(value.lat, value.lng).then((addr) => {
          if (addr) setAddress(addr);
        });
      }
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // 当用户填写位置文本后，地理编码 → 单个结果直接定位，多个结果弹出候选列表
  useEffect(() => {
    if (!locationText || !locationText.trim()) {
      setCandidates([]);
      setShowCandidates(false);
      return;
    }
    if (!mapInstance.current || !ready) return;
    if (geocodedRef.current === locationText) return; // 相同文本已识别过，不重复请求

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      setSearching(true);
      const results = await geocode(locationText);
      setSearching(false);

      if (!mapInstance.current) return;

      if (results.length === 0) {
        setCandidates([]);
        setShowCandidates(false);
        return;
      }

      geocodedRef.current = locationText;

      if (results.length === 1) {
        // 只有一个结果，直接定位
        setCandidates([]);
        setShowCandidates(false);
        placeMarker(results[0].lat, results[0].lng);
      } else {
        // 多个结果，弹出候选列表让用户选择
        setCandidates(results);
        setShowCandidates(true);
      }
    }, 600);

    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    };
  }, [locationText, ready]);

  // 用户从候选列表中选择一个地址
  const handleSelectCandidate = (candidate) => {
    setShowCandidates(false);
    setCandidates([]);
    placeMarker(candidate.lat, candidate.lng);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-[#B8A899]">
          {searching ? '🔍 正在识别地址...' : '输入位置存放点后自动识别，或直接在地图上点击标记'}
        </span>
      </div>

      {/* 地址候选列表 */}
      {showCandidates && candidates.length > 0 && (
        <div className="mb-2 p-3 bg-white rounded-card border border-[#E8D4B8] shadow-sm">
          <p className="text-xs text-[#8B7355] mb-2 font-medium">
            找到 {candidates.length} 个匹配地址，请选择一个：
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {candidates.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectCandidate(c)}
                className="w-full text-left px-3 py-2 rounded-btn text-xs border border-[#E8E0D5] hover:bg-[#F5F0E8] hover:border-[#C8BAAA] transition"
              >
                <span className="font-medium text-[#4A3728]">{c.name}</span>
                <span className="text-[#B8A899] ml-2">{c.address}</span>
                {c.city && (
                  <span className="text-[#B8A899] ml-2">({c.city}{c.district ? ' ' + c.district : ''})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-card border border-gray-300 bg-gray-100"
      />
      {ready && !value && !searching && (
        <p className="text-xs text-[#B8A899] mt-1">请在上方输入位置存放点，或点击地图标记物品位置</p>
      )}
      {value && value.lat && value.lng && (
        <p className="text-xs text-green-600 mt-1">
          ✅ 已选位置：{value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          {address && <span className="text-[#B8A899] ml-2">({address})</span>}
        </p>
      )}
    </div>
  );
}

export default MapPicker;