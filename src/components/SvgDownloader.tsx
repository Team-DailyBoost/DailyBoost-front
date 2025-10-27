import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// SVG 아이콘들의 순수 SVG 코드
const svgIcons = {
  'home-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9.5L12 2L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 21V12H15V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
  </svg>`,
  
  'food-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12H4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="9" cy="10" r="1.5" fill="currentColor" opacity="0.6"/>
    <circle cx="15" cy="9" r="1" fill="currentColor" opacity="0.8"/>
    <circle cx="12" cy="11" r="1.2" fill="currentColor" opacity="0.7"/>
    <circle cx="7" cy="8" r="0.8" fill="currentColor" opacity="0.9"/>
    <circle cx="16" cy="11" r="0.9" fill="currentColor" opacity="0.5"/>
    <path d="M8 6C8 5 8.5 4 9 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M12 5C12 4 12.5 3 13 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M16 6C16 5 16.5 4 17 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  
  'workout-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="11" width="12" height="2" rx="1" fill="currentColor"/>
    <rect x="2" y="8" width="5" height="8" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
    <rect x="3" y="9" width="3" height="6" rx="1" fill="currentColor" opacity="0.3"/>
    <rect x="17" y="8" width="5" height="8" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
    <rect x="18" y="9" width="3" height="6" rx="1" fill="currentColor" opacity="0.3"/>
    <line x1="9" y1="10" x2="9" y2="14" stroke="currentColor" stroke-width="0.5"/>
    <line x1="12" y1="10" x2="12" y2="14" stroke="currentColor" stroke-width="0.5"/>
    <line x1="15" y1="10" x2="15" y2="14" stroke="currentColor" stroke-width="0.5"/>
  </svg>`,
  
  'trophy-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2H16V8C16 10.2091 14.2091 12 12 12C9.79086 12 8 10.2091 8 8V2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" fill-opacity="0.1"/>
    <path d="M6 4H4C3.44772 4 3 4.44772 3 5V7C3 8.10457 3.89543 9 5 9H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 4H20C20.5523 4 21 4.44772 21 5V7C21 8.10457 20.1046 9 19 9H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 12V15H14V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="7" y="15" width="10" height="3" rx="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" fill-opacity="0.2"/>
    <rect x="9" y="18" width="6" height="2" rx="1" fill="currentColor" fill-opacity="0.3"/>
    <path d="M12 5L12.5 6.5H14L12.75 7.5L13.25 9L12 8L10.75 9L11.25 7.5L10 6.5H11.5L12 5Z" fill="currentColor" opacity="0.8"/>
  </svg>`,
  
  'community-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="7" r="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/>
    <path d="M2 19C2 15.6863 4.68629 13 8 13C11.3137 13 14 15.6863 14 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="16" cy="6" r="2.5" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2"/>
    <path d="M22 19C22 16.7909 20.2091 15 18 15C17 15 16.1 15.3 15.4 15.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="11" r="1" fill="currentColor" opacity="0.6"/>
    <circle cx="10" cy="9" r="0.5" fill="currentColor" opacity="0.4"/>
    <circle cx="14" cy="9" r="0.5" fill="currentColor" opacity="0.4"/>
    <path d="M19 4C19.5 3.5 20.5 3.5 21 4C21.5 4.5 21.5 5.5 21 6L20 7L19 6C18.5 5.5 18.5 4.5 19 4Z" fill="currentColor" opacity="0.7"/>
  </svg>`,
  
  'profile-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/>
    <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <g transform="translate(16, 2) scale(0.6)">
      <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.8"/>
      <path d="M7 4H8V3H7V4ZM7 5H8V6H7V5ZM6 3V4H5V3H6ZM6 5V6H5V5H6ZM3 4H2V3H3V4ZM3 5H2V6H3V5ZM4 2V1H3V2H4ZM5 2V1H6V2H5Z" fill="currentColor" opacity="0.6"/>
    </g>
    <rect x="3" y="3" width="2" height="1" rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="3" y="5" width="3" height="1" rx="0.5" fill="currentColor" opacity="0.7"/>
    <rect x="3" y="7" width="1.5" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
  </svg>`,
  
  'heart-rate-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="currentColor" opacity="0.8"/>
    <path d="M3 12H7L9 8L11 16L13 10L15 14H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`,
  
  'calorie-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 8 6 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 6 12 2 12 2Z" fill="currentColor" opacity="0.8"/>
    <path d="M12 5C12 5 10 7 10 9C10 10.1046 10.8954 11 12 11C13.1046 11 14 10.1046 14 9C14 7 12 5 12 5Z" fill="white" opacity="0.9"/>
    <ellipse cx="12" cy="16" rx="6" ry="4" fill="currentColor" opacity="0.3"/>
    <ellipse cx="12" cy="18" rx="4" ry="2" fill="currentColor" opacity="0.5"/>
    <circle cx="6" cy="8" r="1" fill="currentColor" opacity="0.6"/>
    <circle cx="18" cy="12" r="0.8" fill="currentColor" opacity="0.7"/>
    <circle cx="4" cy="14" r="0.6" fill="currentColor" opacity="0.5"/>
    <circle cx="20" cy="16" r="0.7" fill="currentColor" opacity="0.6"/>
  </svg>`,
  
  'water-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3C12 3 6 8 6 14C6 17.3137 8.68629 20 12 20C15.3137 20 18 17.3137 18 14C18 8 12 3 12 3Z" fill="currentColor" opacity="0.7"/>
    <path d="M10 7C10 7 8 9 8 12C8 13.6569 9.34315 15 11 15" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.8"/>
    <ellipse cx="12" cy="18" rx="3" ry="1" fill="currentColor" opacity="0.2"/>
    <ellipse cx="12" cy="17.5" rx="2" ry="0.5" fill="currentColor" opacity="0.3"/>
    <circle cx="9" cy="13" r="0.8" fill="white" opacity="0.6"/>
    <circle cx="14" cy="11" r="0.5" fill="white" opacity="0.8"/>
    <circle cx="11" cy="9" r="0.3" fill="white" opacity="0.7"/>
  </svg>`,
  
  'timer-icon': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.05"/>
    <path d="M12 13L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 13L14 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="13" r="1.5" fill="currentColor"/>
    <path d="M9 3H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="3" r="1" fill="currentColor" opacity="0.7"/>
    <circle cx="12" cy="7" r="0.5" fill="currentColor" opacity="0.6"/>
    <circle cx="12" cy="19" r="0.5" fill="currentColor" opacity="0.6"/>
    <circle cx="18" cy="13" r="0.5" fill="currentColor" opacity="0.6"/>
    <circle cx="6" cy="13" r="0.5" fill="currentColor" opacity="0.6"/>
    <path d="M8 7C6.5 8.5 6.5 10.5 8 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  </svg>`
};

const downloadSvg = (filename: string, svgContent: string) => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`${filename}.svg 파일이 다운로드되었습니다!`);
};

const downloadAllSvgs = () => {
  Object.entries(svgIcons).forEach(([name, content]) => {
    setTimeout(() => downloadSvg(name, content), 100);
  });
  toast.success('모든 SVG 파일이 다운로드되었습니다!');
};

export const SvgDownloader = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">SVG 아이콘 다운로드</h2>
        <Button onClick={downloadAllSvgs} className="gap-2">
          <Download size={16} />
          모두 다운로드
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(svgIcons).map(([name, svgContent]) => (
          <Card key={name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center h-12 w-12 mx-auto bg-muted rounded-lg">
                <div 
                  dangerouslySetInnerHTML={{ __html: svgContent }} 
                  className="w-6 h-6 text-foreground"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <h3 className="text-sm font-medium text-center mb-2 capitalize">
                {name.replace('-', ' ')}
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => downloadSvg(name, svgContent)}
              >
                <Download size={14} />
                다운로드
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">사용 방법:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 다운로드한 SVG 파일을 피그마로 드래그 앤 드롭</li>
          <li>• 피그마에서 색상, 크기, 효과 등을 자유롭게 편집</li>
          <li>• currentColor를 사용해 테마 색상에 맞게 조정</li>
          <li>• 벡터 형식이므로 무한 확대 가능</li>
        </ul>
      </div>
    </div>
  );
};