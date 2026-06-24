import { cn } from '../../lib/utils';

export default function PillNav({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
          )}
        >
          {tab.icon && <tab.icon size={15} />}
          {tab.label}
          {tab.badge > 0 && (
            <span className="bg-emergency-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
