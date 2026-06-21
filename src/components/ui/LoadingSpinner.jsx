export default function LoadingSpinner({ size = 20, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-white border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
