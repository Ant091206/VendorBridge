import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, GitCompareArrows, Receipt, ShoppingCart } from 'lucide-react';
import Panel from './Panel';

const icons = [FilePlus2, GitCompareArrows, ShoppingCart, Receipt];

const QuickActions = memo(({ actions = [] }) => (
  <Panel title="Quick Actions">
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action, index) => {
        const Icon = icons[index] || FilePlus2;
        return (
          <Link key={action.label} to={action.path} className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 font-black text-slate-900 hover:border-[#6D5DFC]/30 hover:bg-white hover:text-[#6D5DFC] hover:shadow-lg">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6D5DFC] shadow-sm group-hover:bg-[#6D5DFC] group-hover:text-white">
              <Icon size={18} />
            </span>
            <span className="text-sm">{action.label}</span>
          </Link>
        );
      })}
    </div>
  </Panel>
));

export default QuickActions;
