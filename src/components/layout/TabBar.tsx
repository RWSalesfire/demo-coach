import { FileInput, BarChart2 } from 'lucide-react';

type TabType = 'input' | 'results';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasResults: boolean;
}

export function TabBar({ activeTab, onTabChange, hasResults }: TabBarProps) {
  return (
    <div className="border-b border-gray-800">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex gap-1">
          <TabButton
            isActive={activeTab === 'input'}
            onClick={() => onTabChange('input')}
            icon={<FileInput className="h-4 w-4" />}
            label="Input"
          />
          <TabButton
            isActive={activeTab === 'results'}
            onClick={() => onTabChange('results')}
            icon={<BarChart2 className="h-4 w-4" />}
            label="Results"
            disabled={!hasResults}
            badge={hasResults}
          />
        </nav>
      </div>
    </div>
  );
}

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  badge?: boolean;
}

function TabButton({ isActive, onClick, icon, label, disabled, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
        isActive
          ? 'border-orange-500 text-orange-500'
          : disabled
          ? 'border-transparent text-gray-600 cursor-not-allowed'
          : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {badge && !isActive && (
        <span className="flex h-2 w-2 rounded-full bg-green-500" />
      )}
    </button>
  );
}
