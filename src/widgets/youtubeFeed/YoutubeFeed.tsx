import React from 'react';

type Props = {
  videoUrls: string[];
};

const getVideoId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : null;
};

const YoutubeFeed: React.FC<Props> = ({ videoUrls }) => {
  const videos = videoUrls
    .map((url) => {
      const id = getVideoId(url);
      if (!id) return null;
      return {
        id,
        embed: `https://www.youtube.com/embed/${id}`,
      };
    })
    .filter(Boolean);

  return (
    <div
      style={{
        maxHeight: '600px',
        overflowY: 'auto',
        padding: '0.5rem',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h2>Latest Community Videos</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {videos.map((video) => (
          <li
            key={video!.id}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem',
            }}
          >
            <iframe
              width="100%"
              height="200"
              src={video!.embed}
              title={`YouTube video ${video!.id}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default YoutubeFeed;
