interface TagSelectorProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function TagSelector({ options, selected, onChange }: TagSelectorProps) {
    
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-3 py-1.5 text-sm font-body capitalize transition-colors ${
              isSelected ? 'bg-yellow-true/50 text-ink' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}