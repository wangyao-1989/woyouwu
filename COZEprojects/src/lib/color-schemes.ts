export interface ColorScheme {
  id: string;
  name: string;
  description: string;
  // 左栏配色
  leftColumn: {
    backgroundColor: string;
    backgroundColorGradient?: string;
    textColor: string;
    nameColor: string;
    contactBgColor: string;
    contactTextColor: string;
    summaryBgColor: string;
    summaryTextColor: string;
    accentColor: string;
    accentGradient?: string;
  };
  // 中栏配色
  middleColumn: {
    backgroundColor: string;
    sectionTitleBgColor: string;
    sectionTitleTextColor: string;
    titleTextColor: string;
    subtitleTextColor: string;
    dateTextColor: string;
    descriptionTextColor: string;
    descriptionBgColor: string;
    accentDotColor: string;
    accentBorderColor: string;
  };
  // 右栏配色
  rightColumn: {
    backgroundColor: string;
    sectionTitleBgColor: string;
    sectionTitleTextColor: string;
    skillCardBgColor: string;
    skillCardBorderColor: string;
    skillCardTextColor: string;
  };
}

export const colorSchemes: ColorScheme[] = [
  {
    id: 'business-blue',
    name: '经典商务蓝',
    description: '最稳妥、最专业，适合金融、法律、咨询等传统行业',
    leftColumn: {
      backgroundColor: '#2C3E50',
      backgroundColorGradient: 'linear-gradient(135deg, #2C3E50 0%, #1F2B38 100%)',
      textColor: '#ECF0F1',
      nameColor: '#FFFFFF',
      contactBgColor: 'rgba(255, 255, 255, 0.1)',
      contactTextColor: '#BDC3C7',
      summaryBgColor: 'rgba(255, 255, 255, 0.05)',
      summaryTextColor: '#BDC3C7',
      accentColor: '#3498DB',
      accentGradient: 'linear-gradient(90deg, #3498DB 0%, #2980B9 100%)',
    },
    middleColumn: {
      backgroundColor: '#FFFFFF',
      sectionTitleBgColor: '#2C3E50',
      sectionTitleTextColor: '#FFFFFF',
      titleTextColor: '#2C3E50',
      subtitleTextColor: '#3498DB',
      dateTextColor: '#7F8C8D',
      descriptionTextColor: '#34495E',
      descriptionBgColor: '#F8F9FA',
      accentDotColor: '#3498DB',
      accentBorderColor: '#3498DB',
    },
    rightColumn: {
      backgroundColor: '#F8F9FA',
      sectionTitleBgColor: '#2C3E50',
      sectionTitleTextColor: '#FFFFFF',
      skillCardBgColor: '#FFFFFF',
      skillCardBorderColor: '#3498DB',
      skillCardTextColor: '#2C3E50',
    },
  },
  {
    id: 'morandi-green',
    name: '莫兰迪绿',
    description: '最治愈、清新，适合教育、环保、设计、文案或医疗健康',
    leftColumn: {
      backgroundColor: '#9AA6A2',
      backgroundColorGradient: 'linear-gradient(135deg, #9AA6A2 0%, #B7C4B1 100%)',
      textColor: '#FFFFFF',
      nameColor: '#FFFFFF',
      contactBgColor: 'rgba(255, 255, 255, 0.15)',
      contactTextColor: '#E8E8E8',
      summaryBgColor: 'rgba(255, 255, 255, 0.1)',
      summaryTextColor: '#E8E8E8',
      accentColor: '#7F8C8D',
      accentGradient: 'linear-gradient(90deg, #7F8C8D 0%, #95A5A6 100%)',
    },
    middleColumn: {
      backgroundColor: '#FFFFFF',
      sectionTitleBgColor: '#9AA6A2',
      sectionTitleTextColor: '#FFFFFF',
      titleTextColor: '#4A4A4A',
      subtitleTextColor: '#6B7B7B',
      dateTextColor: '#7F8C8D',
      descriptionTextColor: '#4A4A4A',
      descriptionBgColor: '#F5F5F5',
      accentDotColor: '#9AA6A2',
      accentBorderColor: '#9AA6A2',
    },
    rightColumn: {
      backgroundColor: '#FAFAFA',
      sectionTitleBgColor: '#9AA6A2',
      sectionTitleTextColor: '#FFFFFF',
      skillCardBgColor: '#FFFFFF',
      skillCardBorderColor: '#9AA6A2',
      skillCardTextColor: '#4A4A4A',
    },
  },
  {
    id: 'earth-tone',
    name: '高级大地色',
    description: '最显质感、温柔，适合建筑、设计、摄影或市场营销',
    leftColumn: {
      backgroundColor: '#C7B198',
      backgroundColorGradient: 'linear-gradient(135deg, #C7B198 0%, #DFD3C3 100%)',
      textColor: '#4A4A4A',
      nameColor: '#2C2C2C',
      contactBgColor: 'rgba(255, 255, 255, 0.3)',
      contactTextColor: '#5A5A5A',
      summaryBgColor: 'rgba(255, 255, 255, 0.2)',
      summaryTextColor: '#5A5A5A',
      accentColor: '#6B4F4F',
      accentGradient: 'linear-gradient(90deg, #6B4F4F 0%, #8B6F6F 100%)',
    },
    middleColumn: {
      backgroundColor: '#FEFEFE',
      sectionTitleBgColor: '#6B4F4F',
      sectionTitleTextColor: '#FFFFFF',
      titleTextColor: '#2C2C2C',
      subtitleTextColor: '#8B6F6F',
      dateTextColor: '#7F7F7F',
      descriptionTextColor: '#4A4A4A',
      descriptionBgColor: '#FDFDFD',
      accentDotColor: '#C7B198',
      accentBorderColor: '#C7B198',
    },
    rightColumn: {
      backgroundColor: '#FAF8F5',
      sectionTitleBgColor: '#6B4F4F',
      sectionTitleTextColor: '#FFFFFF',
      skillCardBgColor: '#FFFFFF',
      skillCardBorderColor: '#C7B198',
      skillCardTextColor: '#2C2C2C',
    },
  },
  {
    id: 'burgundy-red',
    name: '深邃酒红',
    description: '最有气场、高级，适合时尚、管理、奢侈品或创意总监',
    leftColumn: {
      backgroundColor: '#6D3B3B',
      backgroundColorGradient: 'linear-gradient(135deg, #6D3B3B 0%, #8B5A5A 100%)',
      textColor: '#F5E6D3',
      nameColor: '#FFFFFF',
      contactBgColor: 'rgba(245, 230, 211, 0.15)',
      contactTextColor: '#E8D5C4',
      summaryBgColor: 'rgba(245, 230, 211, 0.1)',
      summaryTextColor: '#E8D5C4',
      accentColor: '#D4AF37',
      accentGradient: 'linear-gradient(90deg, #D4AF37 0%, #E5C158 100%)',
    },
    middleColumn: {
      backgroundColor: '#FFFFFF',
      sectionTitleBgColor: '#6D3B3B',
      sectionTitleTextColor: '#FFFFFF',
      titleTextColor: '#2C2C2C',
      subtitleTextColor: '#8B5A5A',
      dateTextColor: '#7F7F7F',
      descriptionTextColor: '#4A4A4A',
      descriptionBgColor: '#FDFCFA',
      accentDotColor: '#D4AF37',
      accentBorderColor: '#6D3B3B',
    },
    rightColumn: {
      backgroundColor: '#F8F6F2',
      sectionTitleBgColor: '#6D3B3B',
      sectionTitleTextColor: '#FFFFFF',
      skillCardBgColor: '#FFFFFF',
      skillCardBorderColor: '#6D3B3B',
      skillCardTextColor: '#2C2C2C',
    },
  },
  {
    id: 'monochrome',
    name: '极简黑白灰',
    description: '永不过时、万能，适合国企、公务员等严肃岗位',
    leftColumn: {
      backgroundColor: '#000000',
      backgroundColorGradient: 'linear-gradient(135deg, #000000 0%, #1A1A1A 100%)',
      textColor: '#FFFFFF',
      nameColor: '#FFFFFF',
      contactBgColor: 'rgba(255, 255, 255, 0.1)',
      contactTextColor: '#CCCCCC',
      summaryBgColor: 'rgba(255, 255, 255, 0.05)',
      summaryTextColor: '#CCCCCC',
      accentColor: '#555555',
      accentGradient: 'linear-gradient(90deg, #555555 0%, #777777 100%)',
    },
    middleColumn: {
      backgroundColor: '#FFFFFF',
      sectionTitleBgColor: '#000000',
      sectionTitleTextColor: '#FFFFFF',
      titleTextColor: '#000000',
      subtitleTextColor: '#333333',
      dateTextColor: '#AAAAAA',
      descriptionTextColor: '#333333',
      descriptionBgColor: '#FAFAFA',
      accentDotColor: '#000000',
      accentBorderColor: '#000000',
    },
    rightColumn: {
      backgroundColor: '#F5F5F5',
      sectionTitleBgColor: '#000000',
      sectionTitleTextColor: '#FFFFFF',
      skillCardBgColor: '#FFFFFF',
      skillCardBorderColor: '#000000',
      skillCardTextColor: '#000000',
    },
  },
];

export const defaultColorScheme = colorSchemes[0];
