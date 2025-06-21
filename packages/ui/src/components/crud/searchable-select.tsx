"use client"

import { Check, ChevronsUpDown, X } from "lucide-react"
import * as React from "react"

import { useSelectTranslation } from "../../i18n/hooks"
import { cn } from "../../lib/utils"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover"

/**
 * Option type for SearchableSelect
 */
export interface SelectOption {
  /** Option value */
  value: string | number
  /** Option label */
  label: string
  /** Option description */
  description?: string
  /** Whether option is disabled */
  disabled?: boolean
  /** Option group */
  group?: string
}

/**
 * Props for SearchableSelect component
 */
export interface SearchableSelectProps {
  /** Available options */
  options: SelectOption[]
  /** Selected value(s) */
  value?: string | number | (string | number)[]
  /** Change handler */
  onValueChange?: (value: string | number | (string | number)[]) => void
  /** Placeholder text */
  placeholder?: string
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Empty state message */
  emptyMessage?: string
  /** Whether multiple selection is enabled */
  multiple?: boolean
  /** Whether search is enabled */
  searchable?: boolean
  /** Whether selection is clearable */
  clearable?: boolean
  /** Loading state */
  loading?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Maximum number of selected items to display */
  maxDisplayItems?: number
  /** Custom option renderer */
  renderOption?: (option: SelectOption) => React.ReactNode
  /** Custom value renderer */
  renderValue?: (option: SelectOption) => React.ReactNode
  /** Async search handler */
  onSearch?: (query: string) => Promise<SelectOption[]> | SelectOption[]
  /** Debounce delay for search (ms) */
  searchDebounce?: number
  /** Custom filter function */
  filterFunction?: (option: SelectOption, query: string) => boolean
  /** Additional props for Command component */
  commandProps?: React.ComponentProps<typeof Command>
}

/**
 * Advanced searchable select component with single/multiple selection support
 * 
 * @example
 * ```tsx
 * // Single selection
 * <SearchableSelect
 *   options={[
 *     { value: "1", label: "Option 1" },
 *     { value: "2", label: "Option 2" },
 *   ]}
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 *   placeholder="Select an option"
 * />
 * 
 * // Multiple selection
 * <SearchableSelect
 *   options={options}
 *   value={selectedValues}
 *   onValueChange={setSelectedValues}
 *   multiple
 *   placeholder="Select options"
 * />
 * 
 * // Async search
 * <SearchableSelect
 *   options={[]}
 *   onSearch={async (query) => {
 *     const results = await searchAPI(query)
 *     return results
 *   }}
 *   placeholder="Search users..."
 * />
 * ```
 */
export function SearchableSelect({
  options: initialOptions = [],
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  multiple = false,
  searchable = true,
  clearable = true,
  loading = false,
  disabled = false,
  maxDisplayItems = 3,
  renderOption,
  renderValue,
  onSearch,
  searchDebounce = 300,
  filterFunction,
  commandProps = {},
}: SearchableSelectProps) {
  const { t } = useSelectTranslation()
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [options, setOptions] = React.useState<SelectOption[]>(initialOptions)
  const [isSearching, setIsSearching] = React.useState(false)

  // Debounced search
  const debouncedSearch = React.useCallback(
    React.useMemo(
      () => {
        let timeoutId: NodeJS.Timeout
        return (query: string) => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(async () => {
            if (onSearch && query.trim()) {
              setIsSearching(true)
              try {
                const results = await onSearch(query)
                setOptions(results)
              } catch (error) {
                console.error("Search error:", error)
              } finally {
                setIsSearching(false)
              }
            } else if (!query.trim()) {
              setOptions(initialOptions)
            }
          }, searchDebounce)
        }
      },
      [onSearch, searchDebounce, initialOptions]
    ),
    [onSearch, searchDebounce, initialOptions]
  )

  // Handle search query change
  React.useEffect(() => {
    if (onSearch) {
      debouncedSearch(searchQuery)
    }
  }, [searchQuery, debouncedSearch, onSearch])

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim() || onSearch) return options

    const defaultFilter = (option: SelectOption, query: string) =>
      option.label.toLowerCase().includes(query.toLowerCase()) ||
      option.description?.toLowerCase().includes(query.toLowerCase())

    const filter = filterFunction || defaultFilter

    return options.filter((option) => filter(option, searchQuery))
  }, [options, searchQuery, filterFunction, onSearch])

  // Get selected options
  const selectedOptions = React.useMemo(() => {
    if (!value) return []
    const values = Array.isArray(value) ? value : [value]
    return options.filter((option) => values.includes(option.value))
  }, [value, options])

  // Handle option selection
  const handleSelect = (selectedValue: string | number) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(selectedValue)
        ? currentValues.filter((v) => v !== selectedValue)
        : [...currentValues, selectedValue]
      onValueChange?.(newValues)
    } else {
      onValueChange?.(selectedValue)
      setOpen(false)
    }
  }

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange?.(multiple ? [] : "")
  }

  // Handle remove single item (for multiple selection)
  const handleRemoveItem = (valueToRemove: string | number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple && Array.isArray(value)) {
      const newValues = value.filter((v) => v !== valueToRemove)
      onValueChange?.(newValues)
    }
  }

  // Render selected value(s)
  const renderSelectedValue = () => {
    if (!selectedOptions.length) {
      return <span className="text-muted-foreground">{placeholder || t('placeholder')}</span>
    }

    if (!multiple) {
      const option = selectedOptions[0]
      return renderValue ? renderValue(option) : option.label
    }

    // Multiple selection display
    if (selectedOptions.length <= maxDisplayItems) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="text-xs">
              {renderValue ? renderValue(option) : option.label}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={(e) => handleRemoveItem(option.value, e)}
              />
            </Badge>
          ))}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1">
        <Badge variant="secondary" className="text-xs">
          {t('selected', { count: selectedOptions.length })}
        </Badge>
        {clearable && (
          <X
            className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          />
        )}
      </div>
    )
  }

  // Group options by group property
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SelectOption[]> = {}
    
    filteredOptions.forEach((option) => {
      const group = option.group || "default"
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(option)
    })

    return groups
  }, [filteredOptions])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex-1 text-left overflow-hidden">
            {renderSelectedValue()}
          </div>
          <div className="flex items-center gap-1">
            {clearable && selectedOptions.length > 0 && (
              <X
                className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command {...commandProps}>
          {searchable && (
            <CommandInput
              placeholder={searchPlaceholder || t('search')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          )}
          <CommandList>
            {(isSearching || loading) && (
              <CommandEmpty>{t('loading')}</CommandEmpty>
            )}
            {!isSearching && !loading && filteredOptions.length === 0 && (
              <CommandEmpty>{emptyMessage || t('noResults')}</CommandEmpty>
            )}
            {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <CommandGroup key={groupName} heading={groupName !== "default" ? groupName : undefined}>
                {groupOptions.map((option) => {
                  const isSelected = multiple
                    ? Array.isArray(value) && value.includes(option.value)
                    : value === option.value

                  return (
                    <CommandItem
                      key={option.value}
                      value={String(option.value)}
                      onSelect={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        "cursor-pointer",
                        option.disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        {renderOption ? (
                          renderOption(option)
                        ) : (
                          <div>
                            <div>{option.label}</div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
