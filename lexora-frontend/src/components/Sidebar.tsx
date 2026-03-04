import React, { useState } from 'react';
import Link from 'next/link';
import { HomeIcon, ClipboardDocumentIcon, UsersIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

const routes = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Notes', path: '/dashboard/notes', icon: ClipboardDocumentIcon },
  { name: 'Team', path: '/dashboard/team', icon: UsersIcon },
  { name: 'Media', path: '/dashboard/media', icon: PhotoIcon },
  { name: 'Publication', path: '/dashboard/publication', icon: DocumentTextIcon },
];

const Sidebar: React.FC = () => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-bgLight dark:bg-bgDark shadow-md h-screen transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <button
          className="p-2 m-2 self-end rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '→' : '←'}
        </button>

        <nav className="flex-1 mt-4">
          {routes.map((route) => {
            const Icon = route.icon;
            const active = router.pathname.startsWith(route.path);
            return (
              <Link key={route.name} href={route.path}>
                <a
                  className={`flex items-center p-3 my-1 rounded transition-colors ${
                    active
                      ? 'bg-primary text-white dark:bg-accent dark:text-bgDark'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-6 h-6 mr-3" />
                  {!collapsed && <span>{route.name}</span>}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;