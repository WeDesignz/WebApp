import { homeMetadata } from '../page-metadata';
import { ReactNode } from 'react';

export const metadata = homeMetadata;

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
