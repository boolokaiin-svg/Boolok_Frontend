import React from 'react';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Pattern, Polygon, Rect, Stop, Text } from 'react-native-svg';

export default function BlueprintPreviewIllustration({ isDark }: { isDark: boolean }) {
  const ink = isDark ? '#DAE9EF' : '#466177';
  const gold = isDark ? '#E9B84A' : '#AA7419';
  return (
    <Svg width="100%" height={166} viewBox="0 0 360 166"
      accessibilityRole="image" accessibilityLabel="A 2D floor plan becoming a furnished 3D interior preview">
      <Defs>
        <LinearGradient id="blueprintPreviewBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={isDark ? '#13243A' : '#F0F5F9'} />
          <Stop offset="1" stopColor={isDark ? '#0B1525' : '#E6EEF3'} />
        </LinearGradient>
        <Pattern id="blueprintPreviewGrid" width="14" height="14" patternUnits="userSpaceOnUse">
          <Path d="M 14 0 H 0 V 14" fill="none" stroke={ink} strokeWidth="0.5" opacity={0.1} />
        </Pattern>
      </Defs>
      <Rect width="360" height="166" rx="14" fill="url(#blueprintPreviewBg)" />
      <Rect width="360" height="166" rx="14" fill="url(#blueprintPreviewGrid)" />
      <G fill={gold} fontSize="9" fontWeight="700" letterSpacing="1.5">
        <Text x="19" y="22">2D FLOOR PLAN</Text>
        <Text x="222" y="22">3D PREVIEW</Text>
      </G>

      {/* Architectural linework, openings and furniture on a drafting sheet. */}
      <G transform="translate(24 42)">
        <Rect width="116" height="85" rx="1" fill={isDark ? '#102237' : '#F9FCFE'} stroke={ink} strokeWidth="2" />
        <Rect x="3" y="3" width="51" height="38" fill={gold} opacity={0.09} />
        <Rect x="58" y="3" width="55" height="38" fill="#7FBDBA" opacity={0.13} />
        <Path d="M56 0V28 M56 40V85 M0 43H20 M34 43H82 M96 43H116" fill="none" stroke={ink} strokeWidth="2" />
        <Path d="M20 43V30Q33 30 33 43 M82 43V30Q95 30 95 43" fill="none" stroke={gold} strokeWidth="0.8" />
        <Path d="M5 9H28V32H5Z M5 16H28 M8 12H15 M18 12H25 M72 8H108V18H97V32" fill="none" stroke={ink} strokeWidth="1" />
        <Rect x="72" y="57" width="29" height="12" rx="3" fill={gold} opacity={0.22} stroke={gold} />
        <Rect x="78" y="74" width="17" height="6" rx="2" fill="none" stroke={ink} strokeWidth="0.8" />
        <Rect x="9" y="52" width="22" height="22" rx="3" fill="none" stroke={ink} strokeWidth="1" />
        <Path d="M13 57H27 M13 62H27 M13 67H27" stroke={ink} strokeWidth="0.7" />
        <Path d="M8 0H38 M72 0H100 M0 56V75 M116 52V72" stroke="#74C7E3" strokeWidth="3" />
        <Path d="M0 95H116 M0 91V99 M116 91V99" stroke={gold} strokeWidth="0.7" />
        <Text x="58" y="109" textAnchor="middle" fill={ink} fontSize="7" letterSpacing="1" opacity={0.7}>YOUR ROOM LAYOUT</Text>
      </G>

      {/* A small transition keeps the preview readable at mobile card widths. */}
      <Circle cx="177" cy="86" r="12" fill={gold} opacity={0.12} />
      <Path d="M171 86H183 M179 82L183 86L179 90" fill="none" stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Roof-removed isometric rooms with warm flooring and furnished interiors. */}
      <Polygon points="210,116 270,85 342,120 282,153" fill="#000" opacity={isDark ? 0.22 : 0.08} />
      <Polygon points="206,101 267,70 337,105 276,138" fill="#C7AA7A" />
      <Polygon points="206,101 235,86 269,103 239,120" fill="#DDC8A3" />
      <Polygon points="235,86 267,70 301,87 269,103" fill="#BBCFD1" />
      <Polygon points="239,120 269,103 304,121 276,138" fill="#CDB68F" />
      <Polygon points="269,103 301,87 337,105 304,121" fill="#E3D4B8" />
      <G stroke="#8B7356" strokeWidth="0.5" opacity={0.3}>
        <Line x1="217" y1="106" x2="278" y2="75" />
        <Line x1="227" y1="112" x2="288" y2="81" />
        <Line x1="249" y1="123" x2="310" y2="92" />
        <Line x1="260" y1="129" x2="321" y2="98" />
      </G>
      <Polygon points="206,101 206,76 267,45 267,70" fill="#DDE7EA" />
      <Polygon points="267,45 337,80 337,105 267,70" fill="#B7C7CD" />
      <Polygon points="213,79 234,68 234,83 213,94" fill="#76B0C4" stroke="#E8F4F7" strokeWidth="1.5" />
      <Polygon points="293,64 320,77 320,90 293,77" fill="#76B0C4" stroke="#E8F4F7" strokeWidth="1.5" />
      <Polygon points="235,86 235,67 267,83 267,103" fill="#E6E9E3" />
      <Polygon points="269,103 269,83 301,67 301,87" fill="#D2DCD9" />
      <Polygon points="216,94 228,88 248,98 236,105" fill="#F6F1E6" />
      <Polygon points="216,94 216,89 228,83 248,93 248,98 228,88" fill="#CCB27F" />
      <Polygon points="218,89 228,84 235,88 225,93" fill="#F9F6ED" />
      <Polygon points="281,111 298,102 314,110 297,119" fill="#EDE4CF" />
      <Polygon points="281,111 281,103 298,94 298,102" fill="#597D7D" />
      <Polygon points="298,94 317,103 317,111 298,102" fill="#7DA19A" />
      <Polygon points="286,122 295,117 303,121 294,126" fill="#956D41" />
      <Path d="M206 76L267 45L337 80" fill="none" stroke="#F7FAF6" strokeWidth="2" />
      <Text x="278" y="159" textAnchor="middle" fill={ink} fontSize="7" letterSpacing="1" opacity={0.7}>BROUGHT TO LIFE</Text>
    </Svg>
  );
}
