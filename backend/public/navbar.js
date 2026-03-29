document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    // Authentication Guard
    if (!userRole && currentPage !== 'login.html') {
        window.location.href = '/login.html';
        return;
    }

    // Role-based Access Control
    const accessMap = {
        'SUPER_ADMIN': ['index.html', 'admin.html', 'dashboard.html', 'gallery.html', 'testing.html', 'dispatched.html', 'settings.html', 'bulk_intake.html', 'details.html', 'inventory_dashboard.html', 'approved_orders.html'],
        'ADMIN': ['index.html', 'admin.html', 'settings.html', 'details.html', 'inventory_dashboard.html', 'dispatched.html', 'approved_orders.html'],
        'DISPATCH': ['dispatched.html', 'details.html', 'approved_orders.html']
    };

    const modulePageMap = {
        'Dashboard': 'index.html',
        'Admin Approvals': 'admin.html',
        'Approved Orders': 'approved_orders.html',
        'Place Order': 'dashboard.html',
        'QR Gallery': 'gallery.html',
        'QR for Testing': 'testing.html',
        'Dispatched': 'dispatched.html',
        'Settings': 'settings.html'
    };

    const userModules = JSON.parse(localStorage.getItem('userModules') || '[]');
    let allowedPages = accessMap[userRole] || [];
    
    // Add pages from assigned modules dynamically
    userModules.forEach(modName => {
        if (modulePageMap[modName]) {
            allowedPages.push(modulePageMap[modName]);
        }
    });
    
    // Always allow common sub-pages if parent is allowed
    if (allowedPages.includes('dispatched.html') || allowedPages.includes('approved_orders.html')) {
        allowedPages.push('details.html');
    }

    allowedPages = [...new Set(allowedPages)]; // Deduplicate

    if (userRole && currentPage !== 'login.html') {
        if (!allowedPages.includes(currentPage) && currentPage !== '') {
            if (allowedPages.length > 0) {
                window.location.href = `/${allowedPages[0]}`;
            } else if (userRole === 'DISPATCH') {
                window.location.href = '/dispatched.html';
            } else {
                window.location.href = '/login.html'; // No access at all
            }
            return;
        }
    }

    // Role-based Nav Item Generation
    const navItems = [];

    const addNav = (name, url, icon, allowedRoles) => {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const hasModule = userModules.includes(name);

        // Permission-based: If it's Super Admin, show everything. 
        // Otherwise, show only if the user has the module assigned in DB.
        if (isSuperAdmin || hasModule) {
            navItems.push(`
            <a href="${url}" class="nav-item ${currentPage === url.replace('/', '') || (url === '/index.html' && currentPage === '') ? 'active' : ''}">
                ${icon}
                ${name}
            </a>`);
        }
    };

    addNav('Dashboard', '/index.html', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>', ['SUPER_ADMIN', 'ADMIN']);
    addNav('Admin Approvals', '/admin.html', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>', ['SUPER_ADMIN', 'ADMIN']);
    addNav('Approved Orders', '/approved_orders.html', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>', ['SUPER_ADMIN', 'ADMIN', 'DISPATCH']);
    addNav('Place Order', '/dashboard.html', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>', ['SUPER_ADMIN']);
    addNav('QR Gallery', '/gallery.html', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>', ['SUPER_ADMIN']);
    addNav('QR for Testing', '/testing.html', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>', ['SUPER_ADMIN']);
    addNav('Dispatched', '/dispatched.html', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 014-4h4m0 0l-4-4m4 4l-4 4m-5 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h2a2 2 0 012-2v3"></path></svg>', ['SUPER_ADMIN', 'ADMIN', 'DISPATCH']);
    addNav('Settings', '/settings.html', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>', ['SUPER_ADMIN', 'ADMIN']);

    window.logout = function() {
        localStorage.removeItem('userRole');
        window.location.href = '/login.html';
    };

    const roleBadge = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="padding: 4px 12px; background: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 0.8rem; font-weight: 700;">
                ${userRole ? userRole.replace('_', ' ') : 'USER'}
            </div>
            <button onclick="logout()" style="cursor: pointer; background: transparent; border: none; color: #64748b; font-weight: 600; font-size: 0.9rem; padding: 4px 8px;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#64748b'">Logout</button>
        </div>
    `;

    const sidebarContent = `
    <nav id="app-navbar">
        <div class="nav-left">
            <a href="/index.html" class="nav-logo" style="text-decoration: none; display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 40px; height: 40px; background: var(--accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.5rem; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);">Y</div>
                <div style="display: flex; flex-direction: column;">
                    <span style="color: var(--text-primary); font-weight: 800; font-size: 1.1rem; line-height: 1;">Yarn Tracker</span>
                    <span style="color: var(--accent); font-weight: 500; font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase;">Pro</span>
                </div>
            </a>
        </div>
        
        <div class="nav-links">
            ${navItems.join('')}
        </div>
        
        <div class="nav-actions">
            <div class="user-profile">
                <span style="font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Current User</span>
                <span style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${userName || 'User'}</span>
                <span style="font-size: 0.75rem; color: var(--accent); font-weight: 600;">${userRole ? userRole.replace('_', ' ') : 'Guest'}</span>
            </div>
            <button onclick="logout()" style="width: 100%; padding: 0.75rem; background: #fff1f2; color: #e11d48; border: none; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onmouseover="this.style.background='#ffe4e6'" onmouseout="this.style.background='#fff1f2'">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Sign Out
            </button>
        </div>
    </nav>
    `;

    // Global toggle function (kept for mobile compatibility if needed)
    window.toggleSidebar = () => {
        const sidebar = document.getElementById('app-navbar');
        if (sidebar) sidebar.classList.toggle('collapsed');
    };

    // Global Side Loading Progress Bar
    const progressBarHTML = `
    <div class="progress-bar-container">
        <div id="progress-bar-fill" class="progress-bar-fill"></div>
    </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', progressBarHTML);
    const progressFill = document.getElementById('progress-bar-fill');
    
    // Animate Progress Bar from 0 to 100 over 400ms
    if (progressFill) {
        setTimeout(() => {
            progressFill.style.width = '100%';
            setTimeout(() => {
                progressFill.style.opacity = '0';
                setTimeout(() => progressFill.parentElement.remove(), 400);
            }, 500);
        }, 50);
    }

    // Injection Strategy
    const placeholder = document.getElementById('navbar-placeholder');
    if (placeholder) {
        placeholder.innerHTML = sidebarContent;
        const nav = placeholder.querySelector('nav');
        if (nav) {
            placeholder.parentNode.insertBefore(nav, placeholder);
            placeholder.remove();
        }
    } else {
        document.body.insertAdjacentHTML('afterbegin', sidebarContent);
    }

    // Global Page Animation injection
    const main = document.querySelector('main');
    if (main) main.classList.add('page-animate');

    // Force Light Theme consistency
    document.documentElement.setAttribute('data-theme', 'light');

    // INITIALIZE CUSTOM DROPDOWNS
    setupCustomDropdowns();

    // Use a more efficient approach for dynamic elements - only run if a select is added
    const observer = new MutationObserver((mutations) => {
        let addedSelects = [];
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.nodeName === 'SELECT') addedSelects.push(node);
                    else {
                        node.querySelectorAll?.('select').forEach(s => addedSelects.push(s));
                    }
                }
            });
        });
        if (addedSelects.length > 0) setupCustomDropdowns();
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

/**
 * Replaces native <select> elements with custom styled dropdowns
 * Uses "Portal" strategy (appends to body) to avoid z-index clipping
 */
function setupCustomDropdowns() {
    const accents = { orange: '#f97316' };

    document.querySelectorAll('select:not(.custom-dropdown-processed):not(.flatpickr-monthDropdown-months)').forEach(select => {
        select.classList.add('custom-dropdown-processed');

        // Create custom wrapper (Anchor)
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.verticalAlign = 'middle';
        wrapper.style.width = select.style.width || 'fit-content';
        wrapper.style.minWidth = '120px';
        if (select.style.maxWidth) wrapper.style.maxWidth = select.style.maxWidth;

        // Hide native select without causing layout jump
        select.style.visibility = 'hidden';
        select.style.position = 'absolute';
        select.style.pointerEvents = 'none';

        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);

        // Trigger Element
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        trigger.style.cssText = `
            background: white; border: 1px solid #cbd5e1; border-radius: 8px; 
            padding: 0.5rem 2rem 0.5rem 1rem; cursor: pointer; color: #334155; 
            position: relative; user-select: none; font-size: 0.9rem; width: 100%;
            display: flex; align-items: center; white-space: nowrap; overflow: hidden;
            box-sizing: border-box;
        `;

        const arrow = document.createElement('div');
        arrow.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
        arrow.style.cssText = `position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none;`;
        trigger.appendChild(arrow);

        const textSpan = document.createElement('span');
        textSpan.textContent = select.options[select.selectedIndex]?.text || select.getAttribute('placeholder') || 'Select...';
        trigger.appendChild(textSpan);
        wrapper.appendChild(trigger);

        // Sync trigger text when native select changes
        const nativeObserver = new MutationObserver(() => {
            textSpan.textContent = select.options[select.selectedIndex]?.text || '';
        });
        nativeObserver.observe(select, { childList: true, subtree: true, attributes: true });

        // OPEN DROPDOWN FUNCTION
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();

            // Close any existing open dropdowns
            document.querySelectorAll('.custom-options-portal').forEach(el => el.remove());

            // Calculate positioning
            const rect = wrapper.getBoundingClientRect();

            // Create Portal Menu
            const optionsList = document.createElement('div');
            optionsList.className = 'custom-options-portal';
            optionsList.style.cssText = `
                position: absolute; 
                top: ${rect.bottom + window.scrollY + 4}px; 
                left: ${rect.left + window.scrollX}px; 
                width: ${rect.width}px;
                min-width: 120px;
                background: white; border: 1px solid #e2e8f0; border-radius: 8px; 
                z-index: 2147483647; /* MAX Z-INDEX */
                box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.15);
                max-height: 250px; overflow-y: auto;
                animation: fadeIn 0.1s ease-out;
            `;

            // Populate Options
            Array.from(select.options).forEach(opt => {
                const optDiv = document.createElement('div');
                optDiv.textContent = opt.text;
                optDiv.style.cssText = `padding: 8px 12px; cursor: pointer; color: #334155; transition: all 0.1s; font-size: 0.9rem;`;

                // Highlight Selected
                if (select.value === opt.value) {
                    optDiv.style.backgroundColor = accents.orange;
                    optDiv.style.color = 'white';
                }

                // Interaction
                optDiv.addEventListener('mouseenter', () => {
                    if (select.value !== opt.value) {
                        optDiv.style.backgroundColor = accents.orange;
                        optDiv.style.color = 'white';
                    }
                });
                optDiv.addEventListener('mouseleave', () => {
                    if (select.value !== opt.value) {
                        optDiv.style.backgroundColor = 'white';
                        optDiv.style.color = '#334155';
                    }
                });

                optDiv.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    select.value = opt.value;
                    textSpan.textContent = opt.text;
                    optionsList.remove(); // Close

                    // Trigger native event
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                    const inputEvent = new Event('input', { bubbles: true });
                    select.dispatchEvent(inputEvent);
                });

                optionsList.appendChild(optDiv);
            });

            // Prevent scrollbar interaction from closing the menu
            optionsList.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            document.body.appendChild(optionsList);

            // Scroll handling to close if user scrolls away (BUT ignored if scrolling inside the dropdown)
            const scrollHandler = (e) => {
                if (optionsList.contains(e.target) || e.target === optionsList) {
                    return; // Ignore scroll events inside the dropdown
                }
                optionsList.remove();
                window.removeEventListener('scroll', scrollHandler, { capture: true });
            };
            // Use capture:true to detect outside scrolls, but filter inside scrollHandler
            window.addEventListener('scroll', scrollHandler, { capture: true });

            // Close on click outside
            const clickHandler = () => {
                optionsList.remove();
                window.removeEventListener('scroll', scrollHandler, { capture: true }); // Clean up scroll listener too
            };
            setTimeout(() => document.addEventListener('click', clickHandler, { once: true }), 0);
        });
    });
}
