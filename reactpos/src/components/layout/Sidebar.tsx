import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import menuData from '../../data/menuData';

interface MenuItemType {
  title: string;
  icon?: string;
  iconType?: 'tabler' | 'feather';
  path?: string;
  badge?: string;
  children?: MenuItemType[];
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const isActive = useCallback((path?: string) => {
    if (!path || path === '#') return false;
    return location.pathname === path;
  }, [location.pathname]);

  const isMenuActive = useCallback((item: MenuItemType): boolean => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some(child => isMenuActive(child));
    }
    return false;
  }, [isActive]);

  useEffect(() => {
    const newOpen = new Set<string>();
    const findOpen = (items: MenuItemType[], prefix: string) => {
      items.forEach((item, idx) => {
        const key = `${prefix}-${idx}`;
        if (item.children) {
          const hasActive = item.children.some(child => isMenuActive(child));
          if (hasActive) {
            newOpen.add(key);
            findOpen(item.children, key);
          }
        }
      });
    };
    menuData.forEach((section, si) => {
      findOpen(section.items as MenuItemType[], `s${si}`);
    });
    setOpenMenus(newOpen);
  }, [location.pathname, isMenuActive]);

  const toggleMenu = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenMenus(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderIcon = (icon?: string, iconType?: string) => {
    if (!icon) return null;
    if (iconType === 'feather') {
      return <i data-feather={icon}></i>;
    }
    return <i className={`ti ${icon} fs-16 me-2`}></i>;
  };

  const handleNavClick = (e: React.MouseEvent, path?: string) => {
    if (path && path !== '#') {
      e.preventDefault();
      navigate(path);
      // Close mobile sidebar
      document.body.classList.remove('slide-nav');
    }
  };

  const renderSubmenuItems = (
    items: MenuItemType[],
    parentKey: string,
    level: number = 0
  ): React.ReactNode => {
    return items.map((item, idx) => {
      const key = `${parentKey}-${idx}`;
      const hasChildren = item.children && item.children.length > 0;
      const active = isMenuActive(item);
      const isOpen = openMenus.has(key);

      if (hasChildren) {
        const submenuClass = level === 0
          ? 'submenu'
          : level === 1
            ? 'submenu submenu-two'
            : 'submenu submenu-two submenu-three';
        const arrowClass = level === 0
          ? 'menu-arrow'
          : level === 1
            ? 'menu-arrow inside-submenu'
            : 'menu-arrow inside-submenu inside-submenu-two';

        return (
          <li key={key} className={submenuClass}>
            <a
              href="#"
              onClick={(e) => toggleMenu(key, e)}
              className={`${isOpen ? 'subdrop' : ''} ${active ? 'active' : ''}`}
            >
              {item.icon && renderIcon(item.icon, item.iconType)}
              <span>{item.title}</span>
              <span className={arrowClass}></span>
            </a>
            <ul style={{ display: isOpen ? 'block' : 'none' }}>
              {renderSubmenuItems(item.children!, key, level + 1)}
            </ul>
          </li>
        );
      }

      return (
        <li key={key}>
          <a
            href={item.path || '#'}
            className={isActive(item.path) ? 'active' : ''}
            onClick={(e) => handleNavClick(e, item.path)}
          >
            {item.icon && renderIcon(item.icon, item.iconType)}
            <span>{item.title}</span>
            {item.badge && (
              <span className="badge bg-primary badge-xs text-white fs-10 ms-2">{item.badge}</span>
            )}
          </a>
        </li>
      );
    });
  };

  return (
    <div className="sidebar" id="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link to="/" className="logo logo-normal">
          <img src="/assets/img/logo.svg" alt="Logo" />
        </Link>
        <Link to="/" className="logo logo-white">
          <img src="/assets/img/logo-white.svg" alt="Logo" />
        </Link>
        <Link to="/" className="logo-small">
          <img src="/assets/img/logo-small.png" alt="Logo" />
        </Link>
        <Link to="/" className="logo-small-white">
          <img src="/assets/img/logo-small-white.png" alt="Logo" />
        </Link>
        <a id="toggle_btn" href="#" onClick={(e) => {
          e.preventDefault();
          document.body.classList.toggle('mini-sidebar');
        }}>
          <i data-feather="chevrons-left" className="feather-16"></i>
        </a>
      </div>

      {/* Modern Profile */}
      <div className="modern-profile p-3 pb-0">
        <div className="text-center rounded bg-light p-3 mb-4 user-profile">
          <div className="avatar avatar-lg online mb-3">
            <img src="/assets/img/customer/customer15.jpg" alt="Profile" className="img-fluid rounded-circle" />
          </div>
          <h6 className="fs-14 fw-bold mb-1">Adrian Herman</h6>
          <p className="fs-12 mb-0">System Admin</p>
        </div>
        <div className="sidebar-nav mb-3">
          <ul className="nav nav-tabs nav-tabs-solid nav-tabs-rounded nav-justified bg-transparent" role="tablist">
            <li className="nav-item"><a className="nav-link active border-0" href="#">Menu</a></li>
            <li className="nav-item"><Link className="nav-link border-0" to="/chat">Chats</Link></li>
            <li className="nav-item"><Link className="nav-link border-0" to="/email">Inbox</Link></li>
          </ul>
        </div>
      </div>

      {/* Sidebar Header */}
      <div className="sidebar-header p-3 pb-0 pt-2">
        <div className="text-center rounded bg-light p-2 mb-4 sidebar-profile d-flex align-items-center">
          <div className="avatar avatar-md onlin">
            <img src="/assets/img/customer/customer15.jpg" alt="Profile" className="img-fluid rounded-circle" />
          </div>
          <div className="text-start sidebar-profile-info ms-2">
            <h6 className="fs-14 fw-bold mb-1">Adrian Herman</h6>
            <p className="fs-12">System Admin</p>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-between menu-item mb-3">
          <div>
            <Link to="/" className="btn btn-sm btn-icon bg-light">
              <i className="ti ti-layout-grid-remove"></i>
            </Link>
          </div>
          <div>
            <Link to="/chat" className="btn btn-sm btn-icon bg-light">
              <i className="ti ti-brand-hipchat"></i>
            </Link>
          </div>
          <div>
            <Link to="/email" className="btn btn-sm btn-icon bg-light position-relative">
              <i className="ti ti-message"></i>
            </Link>
          </div>
          <div className="notification-item">
            <Link to="/activities" className="btn btn-sm btn-icon bg-light position-relative">
              <i className="ti ti-bell"></i>
              <span className="notification-status-dot"></span>
            </Link>
          </div>
          <div className="me-0">
            <Link to="/general-settings" className="btn btn-sm btn-icon bg-light">
              <i className="ti ti-settings"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="sidebar-inner slimscroll" style={{
        overflowY: 'auto',
        height: 'calc(100vh - 60px)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#ccc transparent',
      }}>
        <div id="sidebar-menu" className="sidebar-menu">
          <ul>
            {menuData.map((section, sectionIdx) => (
              <li key={sectionIdx} className="submenu-open">
                <h6 className="submenu-hdr">{section.header}</h6>
                <ul>
                  {(section.items as MenuItemType[]).map((item, idx) => {
                    const key = `s${sectionIdx}-${idx}`;
                    const hasChildren = item.children && item.children.length > 0;
                    const active = isMenuActive(item);
                    const isOpen = openMenus.has(key);

                    if (hasChildren) {
                      return (
                        <li key={key} className="submenu">
                          <a
                            href="#"
                            onClick={(e) => toggleMenu(key, e)}
                            className={`${isOpen ? 'subdrop' : ''} ${active ? 'active' : ''}`}
                          >
                            {renderIcon(item.icon, item.iconType)}
                            <span>{item.title}</span>
                            <span className="menu-arrow"></span>
                          </a>
                          <ul style={{ display: isOpen ? 'block' : 'none' }}>
                            {renderSubmenuItems(item.children!, key, 1)}
                          </ul>
                        </li>
                      );
                    }

                    return (
                      <li key={key}>
                        <a
                          href={item.path || '#'}
                          className={isActive(item.path) ? 'active' : ''}
                          onClick={(e) => handleNavClick(e, item.path)}
                        >
                          {renderIcon(item.icon, item.iconType)}
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="badge bg-primary badge-xs text-white fs-10 ms-2">
                              {item.badge}
                            </span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
