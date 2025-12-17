/* eslint-disable react/prop-types */
import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const useFilters = () => useContext(FilterContext);

export const FilterProvider = ({ children }) => {
    const [filters, setFilters] = useState({
        duplicate: false,
        email: false,
        phone: false,
        unify: false,
        job_normalization: false,
        fake_domain: false,
        missing_fields: false
    });

    const [duplicateColumns, setDuplicateColumns] = useState([]);

    const toggleFilter = (key) => {
        setFilters(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const resetFilters = () => {
        setFilters({
            duplicate: false,
            email: false,
            phone: false,
            unify: false,
            job_normalization: false,
            fake_domain: false,
            missing_fields: false
        });
    };

    // Helper to get active filters JSON string for API
    const getActiveFiltersJSON = () => {
        const activeFilters = { ...filters };
        if (activeFilters.duplicate && duplicateColumns.length > 0) {
            activeFilters.duplicate_columns = duplicateColumns;
        }
        return JSON.stringify(activeFilters);
    };

    const setDuplicateFilter = (columns) => {
        setDuplicateColumns(columns);
        setFilters(prev => ({ ...prev, duplicate: true }));
    };

    const activeCount = Object.values(filters).filter(Boolean).length;

    return (
        <FilterContext.Provider value={{ filters, toggleFilter, resetFilters, getActiveFiltersJSON, activeCount, duplicateColumns, setDuplicateColumns, setDuplicateFilter }}>
            {children}
        </FilterContext.Provider>
    );
};
