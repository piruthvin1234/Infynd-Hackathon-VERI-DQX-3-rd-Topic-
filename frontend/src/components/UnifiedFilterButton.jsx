import React, { useState, useRef, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { useTheme } from '../context/ThemeContext';

import {
  Filter,
  Copy,
  MailCheck,
  PhoneCall,
  Layers,
  Briefcase,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';

import DuplicateColumnSelector from './DuplicateColumnSelector';

const UnifiedFilterButton = ({ columns = [] }) => {
  const {
    filters,
    toggleFilter,
    activeCount,
    duplicateColumns,
    setDuplicateFilter
  } = useFilters();

  const { getColors } = useTheme();
  const colors = getColors();

  const [isOpen, setIsOpen] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const dropdownRef = useRef(null);

  /* ---------------------------------------------
     Close dropdown on outside click
  --------------------------------------------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ---------------------------------------------
     Handle filter logic
  --------------------------------------------- */
  const handleFilterClick = (key) => {
    if (key === 'duplicate') {
      if (!filters.duplicate) {
        setShowDuplicateModal(true);
      } else {
        toggleFilter(key);
      }
    } else {
      toggleFilter(key);
    }
  };

  const handleDuplicateApply = (selectedCols) => {
    setDuplicateFilter(selectedCols);
    setShowDuplicateModal(false);
  };

  /* ---------------------------------------------
     Filter definitions (professional only)
  --------------------------------------------- */
  const filterOptions = [
    {
      key: 'duplicate',
      label: 'Duplicate Check',
      description: 'Detect duplicate records across selected fields',
      icon: Copy
    },
    {
      key: 'email',
      label: 'Email Validation',
      description: 'Validate email format and domain',
      icon: MailCheck
    },
    {
      key: 'phone',
      label: 'Phone Validation',
      description: 'Verify phone number structure',
      icon: PhoneCall
    },
    {
      key: 'unify',
      label: 'Company Unification',
      description: 'Standardize organization naming',
      icon: Layers
    },
    {
      key: 'job_normalization',
      label: 'Job Normalization',
      description: 'Map titles to normalized job functions',
      icon: Briefcase
    },
    {
      key: 'fake_domain',
      label: 'Fake Domain Detection',
      description: 'Detect disposable or fake domains',
      icon: ShieldAlert
    },
    {
      key: 'missing_fields',
      label: 'Missing Field Detection',
      description: 'Identify missing mandatory attributes',
      icon: AlertTriangle
    }
  ];

  return (
    <div ref={dropdownRef} className="relative inline-block z-20">
      {/* =========================================
          FILTER BUTTON
      ========================================= */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm transition-all active:scale-95"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          color: colors.textPrimary
        }}
      >
        <div className="relative">
          <Filter
            className="w-5 h-5"
            style={{
              color:
                activeCount > 0 ? colors.accent1 : colors.textSecondary
            }}
          />
          {activeCount > 0 && (
            <span
              className="absolute -top-2 -right-2 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center"
              style={{
                backgroundColor: colors.accent1,
                color: '#fff'
              }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <span className="text-sm font-semibold tracking-wide">Filters</span>
      </button>

      {/* =========================================
          DROPDOWN PANEL
      ========================================= */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl backdrop-blur-xl animate-fade-in overflow-hidden"
          style={{
            backgroundColor: `${colors.cardBg}f5`,
            borderColor: colors.border
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b flex justify-between items-center"
            style={{ borderColor: colors.border }}
          >
            <h3
              className="text-sm font-bold tracking-wide"
              style={{ color: colors.textPrimary }}
            >
              Data Quality Filters
            </h3>
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: colors.secondary,
                color: colors.textSecondary
              }}
            >
              {activeCount} active
            </span>
          </div>

          {/* Filters */}
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              const isActive = filters[option.key];

              return (
                <div
                  key={option.key}
                  onClick={() => handleFilterClick(option.key)}
                  className={`mx-2 my-1 rounded-xl border cursor-pointer transition-all
                    ${isActive ? 'shadow-md scale-[1.01]' : 'hover:shadow-sm'}
                  `}
                  style={{
                    borderColor: isActive
                      ? colors.accent1
                      : colors.border,
                    backgroundColor: isActive
                      ? colors.secondary
                      : 'transparent'
                  }}
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    {/* Icon */}
                    <div
                      className="p-2 rounded-lg border"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{
                          color: isActive
                            ? colors.accent1
                            : colors.textSecondary
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: colors.textPrimary }}
                        >
                          {option.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={isActive}
                          readOnly
                          className="w-4 h-4 accent-blue-600"
                        />
                      </div>

                      <p
                        className="text-xs mt-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {option.description}
                      </p>

                      {option.key === 'duplicate' &&
                        isActive &&
                        duplicateColumns.length > 0 && (
                          <p className="mt-1 text-[11px] font-mono text-blue-500">
                            Columns: {duplicateColumns.join(', ')}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="px-3 py-2 border-t text-center text-xs italic"
            style={{
              borderColor: colors.border,
              color: colors.textSecondary
            }}
          >
            Filters are applied automatically
          </div>
        </div>
      )}

      {/* =========================================
          DUPLICATE COLUMN MODAL
      ========================================= */}
      <DuplicateColumnSelector
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onApply={handleDuplicateApply}
        columns={columns}
        selectedColumns={duplicateColumns}
      />
    </div>
  );
};

export default UnifiedFilterButton;
