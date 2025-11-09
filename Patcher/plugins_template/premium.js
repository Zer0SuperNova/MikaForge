(function() {
    'use strict';
    
    // Mark this plugin as loaded
    window.__mikaForgePremium = true;    
    const fakeSubscription = {
        active: true,
        details: {
            state: 'Active',
            source: 'Overwolf',
            id: 'give-me-a-sub-please-im-broke'
        }
    };
    
    Object.defineProperty(Object.prototype, 'subscription', {
        get() {
            return fakeSubscription;
        },
        set() {},
        configurable: true,
        enumerable: false
    });
    
    Object.defineProperty(Object.prototype, 'noAdsSubscription', {
        get() {
            return fakeSubscription;
        },
        set() {},
        configurable: true,
        enumerable: false
    });
    
    const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    Object.getOwnPropertyDescriptor = function(obj, prop) {
        const desc = originalGetOwnPropertyDescriptor.call(this, obj, prop);
        
        if (prop === 'isPremium' && desc && obj.theme !== undefined) {
            return {
                ...desc,
                value: false,
                writable: false,
                enumerable: true,
                configurable: true
            };
        }
        
        if (prop === 'forceUnlock' && desc && obj.theme !== undefined) {
            return {
                ...desc,
                value: true,
                writable: false,
                enumerable: true,
                configurable: true
            };
        }
        
        return desc;
    };
    
    const _isPremium = Symbol('isPremium');
    const _forceUnlock = Symbol('forceUnlock');
    
    Object.defineProperty(Object.prototype, 'isPremium', {
        get: function() {
            if (this.theme !== undefined && this.className !== undefined) {
                return false;
            }
            return this[_isPremium];
        },
        set: function(val) {
            this[_isPremium] = val;
        },
        configurable: true,
        enumerable: false
    });
    
    Object.defineProperty(Object.prototype, 'forceUnlock', {
        get: function() {
            if (this.theme !== undefined && this.className !== undefined) {
                return true;
            }
            return this[_forceUnlock];
        },
        set: function(val) {
            this[_forceUnlock] = val;
        },
        configurable: true,
        enumerable: false
    });
})();
