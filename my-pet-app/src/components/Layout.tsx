import { Outlet, NavLink } from 'react-router-dom';
import { Home, PawPrint, Syringe, Gift, User } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/pets', icon: PawPrint, label: 'Mascotas' },
  { to: '/vaccines', icon: Syringe, label: 'Vacunas' },
  { to: '/loyalty', icon: Gift, label: 'Lealtad' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-20">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-16 h-full text-xs font-medium transition-colors',
                  isActive ? 'text-primary-600' : 'text-gray-500'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    className={cn(
                      'w-6 h-6 mb-1',
                      isActive && 'text-primary-600'
                    )} 
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
