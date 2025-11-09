(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.MikaForge) {
        return;
    }
    
    // MikaForge Plugin API
    window.MikaForge = {
        // Event bus
        _events: {},
        _pluginRegistry: {},
        
        // Event system
        on: function(event, callback) {
            if (!this._events[event]) {
                this._events[event] = [];
            }
            this._events[event].push(callback);
        },
        
        off: function(event, callback) {
            if (this._events[event]) {
                this._events[event] = this._events[event].filter(cb => cb !== callback);
            }
        },
        
        emit: function(event, ...args) {
            if (this._events[event]) {
                this._events[event].forEach(callback => {
                    try {
                        callback(...args);
                    } catch (error) {
                        console.error(`[MikaForge] Error in event handler for ${event}:`, error);
                    }
                });
            }
        },
        
        // Plugin registration
        register: function(pluginName, pluginData) {
            this._pluginRegistry[pluginName] = {
                name: pluginName,
                onLoad: pluginData.onLoad || null,
                onUnload: pluginData.onUnload || null,
                onThemeChange: pluginData.onThemeChange || null,
                onWindowOpen: pluginData.onWindowOpen || null,
                hooks: pluginData.hooks || {},
                loaded: true,
                loadTime: Date.now()
            };
            
            // Call onLoad hook if provided
            if (this._pluginRegistry[pluginName].onLoad) {
                try {
                    this._pluginRegistry[pluginName].onLoad();
                } catch (error) {
                    console.error(`[MikaForge] Error in onLoad hook for ${pluginName}:`, error);
                }
            }
        },
        
        // Unregister plugin
        unregister: function(pluginName) {
            if (this._pluginRegistry[pluginName]) {
                // Call onUnload hook if provided
                if (this._pluginRegistry[pluginName].onUnload) {
                    try {
                        this._pluginRegistry[pluginName].onUnload();
                    } catch (error) {
                        console.error(`[MikaForge] Error in onUnload hook for ${pluginName}:`, error);
                    }
                }
                
                delete this._pluginRegistry[pluginName];
            }
        },
        
        // Get plugin info
        getPlugin: function(pluginName) {
            return this._pluginRegistry[pluginName] || null;
        },
        
        // Get all plugins
        getPlugins: function() {
            return Object.keys(this._pluginRegistry).map(name => ({
                name: name,
                ...this._pluginRegistry[name]
            }));
        },
        
        // UI Hooks - Insert buttons or panels
        insertButton: function(container, buttonConfig) {
            const button = document.createElement('button');
            button.textContent = buttonConfig.text || 'Button';
            button.className = buttonConfig.className || '';
            button.style.cssText = buttonConfig.style || '';
            
            if (buttonConfig.onClick) {
                button.addEventListener('click', buttonConfig.onClick);
            }
            
            if (typeof container === 'string') {
                const element = document.querySelector(container);
                if (element) {
                    element.appendChild(button);
                    return button;
                }
            } else if (container && container.appendChild) {
                container.appendChild(button);
                return button;
            }
            
            return null;
        },
        
        insertPanel: function(container, panelConfig) {
            const panel = document.createElement('div');
            panel.className = panelConfig.className || '';
            panel.style.cssText = panelConfig.style || '';
            panel.innerHTML = panelConfig.html || '';
            
            if (typeof container === 'string') {
                const element = document.querySelector(container);
                if (element) {
                    element.appendChild(panel);
                    return panel;
                }
            } else if (container && container.appendChild) {
                container.appendChild(panel);
                return panel;
            }
            
            return null;
        },
        
        // Trigger lifecycle hooks
        _triggerThemeChange: function(themeName) {
            this.emit('themeChanged', themeName);
            
            // Call onThemeChange hooks for all plugins
            Object.values(this._pluginRegistry).forEach(plugin => {
                if (plugin.onThemeChange) {
                    try {
                        plugin.onThemeChange(themeName);
                    } catch (error) {
                        console.error(`[MikaForge] Error in onThemeChange hook for ${plugin.name}:`, error);
                    }
                }
            });
        },
        
        _triggerWindowOpen: function() {
            this.emit('windowOpen');
            
            // Call onWindowOpen hooks for all plugins
            Object.values(this._pluginRegistry).forEach(plugin => {
                if (plugin.onWindowOpen) {
                    try {
                        plugin.onWindowOpen();
                    } catch (error) {
                        console.error(`[MikaForge] Error in onWindowOpen hook for ${plugin.name}:`, error);
                    }
                }
            });
        }
    };
    
    console.log('[MikaForge] Plugin API initialized');
})();

