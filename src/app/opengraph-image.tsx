import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PRIMA PTBA - Sistem Pemilihan Mitra PT Bukit Asam Tbk';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1B3A5C 0%, #1e4570 50%, #2E75B6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            width: '80px',
            height: '4px',
            backgroundColor: '#F2A900',
            borderRadius: '2px',
            marginBottom: '32px',
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '16px',
          }}
        >
          PRIMA PTBA
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#F2A900',
            textAlign: 'center',
            marginBottom: '24px',
            fontWeight: 600,
          }}
        >
          Sistem Pemilihan Mitra
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.85)',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.5,
          }}
        >
          Platform resmi pemilihan mitra PT Bukit Asam Tbk
          untuk proyek energi baru terbarukan
        </div>

        {/* Gold accent line bottom */}
        <div
          style={{
            width: '80px',
            height: '4px',
            backgroundColor: '#F2A900',
            borderRadius: '2px',
            marginTop: '32px',
          }}
        />

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          prima.bukitasam.co.id
        </div>
      </div>
    ),
    { ...size }
  );
}
