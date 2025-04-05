'use client';

import { Box } from '@mui/material';
import Image from 'next/image';

interface AvatarImageProps {
  src: string;
  alt: string;
}

export default function AvatarImage({ src, alt }: AvatarImageProps) {
  return (
    <Box
      sx={{
        width: 180,
        height: 180,
        mx: 'auto',
        mb: 2.5,
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: 2,
      }}
    >
      <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} />
    </Box>
  );
}
