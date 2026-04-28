import { Category } from '../types';

const CATEGORIES: Category[] = ['AI编程', 'AI动态', '文哲史', '旅游', '活动展览', '工作思路', '其他'];

interface CategorySelectorProps {
  selected: Category;
  onChange: (category: Category) => void;
  label?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  selected, 
  onChange, 
  label = '选择分类' 
}) => {
  return (
    <div className="category-selector">
      <label className="category-label">{label}</label>
      <div className="category-grid">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-button ${selected === category ? 'active' : ''}`}
            onClick={() => onChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};
