type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[] | null;
};

export default function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((item, i) => (
        <script
          // eslint-disable-next-line react/no-danger
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
