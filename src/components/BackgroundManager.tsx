"use client";

import { usePathname } from 'next/navigation';
import SnowBackground from './SnowBackground';
import MatrixBackground from './MatrixBackground';

export default function BackgroundManager() {
  const pathname = usePathname();

  // /archive-demo の時だけキャンドル演出に切り替え
  if (pathname === '/archive-demo') {
    return <MatrixBackground />;
  }

  // それ以外の画面は雪を降らせる
  return <SnowBackground />;
}