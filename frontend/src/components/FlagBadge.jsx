export default function FlagBadge({ flag }) {
  return (
    <article className={`flag-card flag-${flag.level}`}>
      <div className="flag-card-header">
        <span className="flag-dot" aria-hidden="true" />
        <strong>{flag.title}</strong>
      </div>
      <p>{flag.description}</p>
    </article>
  );
}
