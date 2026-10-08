export default function PageTitle({ title, subtitle, extra = null }) {
  return (
    <div className="flex items-center justify-between mb-6 mt-2">
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{extra}</div>
    </div>
  );
}
