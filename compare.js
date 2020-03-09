compareSet = (oldValues, newValues) => {
        if (typeof oldValues !== typeof newValues) return false;
        if (!Array.isArray(oldValues) && typeof oldValues !== 'object') {
            if (oldValues !== newValues) return false;
            return true;
        }
        if (Array.isArray(oldValues)) {
            if (oldValues.length !== newValues.length) return false;
            if (JSON.stringify(oldValues) !== JSON.stringify(newValues)) return false;
            return true;
        }
        if (typeof oldValues === 'object') {
            if (Object.keys(oldValues).length !== Object.keys(newValues).length) return false;
            if (!Object.keys(oldValues).every((key, iteration) => key !== newValues[iteration])) return false;
            if (!Object.entries(oldValues).every(([key, value]) => JSON.stringify(value) !== JSON.stringify(newValues[key]))) return false;
            return true;
        }
        return true;
    }