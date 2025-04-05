'use client';

interface SessionErrorDisplayProps {
  error: Error;
}

export default function SessionErrorDisplay({ error }: SessionErrorDisplayProps) {
  return (
    <div
      style={{
        padding: '20px',
        margin: '20px',
        backgroundColor: '#ffebee',
        border: '1px solid #ef5350',
        borderRadius: '4px',
      }}
    >
      <h2>Session Error</h2>
      <p>There was a problem loading your session. Trying to recover...</p>
      <p>
        <small>{error.message}</small>
      </p>
    </div>
  );
}
