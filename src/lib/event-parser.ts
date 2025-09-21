import { addMinutes, setHours, setMinutes } from 'date-fns'

import { FlopEvent } from 'types/api'
import { GroupHierarchy, PromoGroups } from 'types/base'

import { CalendarEvent } from '~/calendar/types'

import { extractDurationFromType, getClosestColor, getDayDate } from './utils'

export class JSONEventParser {
  /**
   * Parses a single server event to CalendarEvent
   */
  private static parseEvent(event: FlopEvent): CalendarEvent {
    const date = getDayDate(event.day, event.course.week, event.course.year)
    const startDateTime = setMinutes(setHours(date, 0), event.start_time)
    const duration = extractDurationFromType(event.course.type)
    const endDateTime = addMinutes(startDateTime, duration)

    // Build description
    const groups = event.course.groups
      .map((g) => `${g.train_prog} ${g.name}`)
      .join(', ')
    const description = [
      `Type: ${event.course.type}`,
      `Module: ${event.course.module.name}`,
      `Groups: ${groups}`,
      event.course.supp_tutor.length > 0
        ? `Support Tutors: ${event.course.supp_tutor.join(', ')}`
        : '',
      `Week: ${event.course.week}`,
      `Session: ${event.number}`,
    ]
      .filter(Boolean)
      .join('\n')

    return {
      id: `flop-event-${event.id}`,
      dateRange: {
        start: startDateTime,
        end: endDateTime,
      },
      title: event.course.module.name || event.course.module.abbrev,
      description,
      location: event.room.name,
      staff: event.tutor,
      color: getClosestColor(event.course.module.display.color_bg),
      groups: event.course.groups,
    }
  }

  static filter(
    src: CalendarEvent[],
    filterGroups?: string[]
  ): CalendarEvent[] {
    const groups = this.extractGroups(src)
    const allparentGroups = new Set<string>()

    filterGroups?.forEach((group) => {
      const parents = this.getParentGroups(group, groups)
      parents.forEach((p) => allparentGroups.add(p))
    })

    filterGroups = Array.from(allparentGroups)

    let events = src
    if (filterGroups && filterGroups.length > 0) {
      events = events.filter((event) => {
        if (!event.groups || event.groups.length === 0) return false

        return filterGroups.some((fg) => {
          return event.groups!.some((group) => {
            const fn = `${group.train_prog} ${group.name}`
            if (fg === fn || fg === group.name || fg === group.train_prog)
              return true

            const filterParts = fg.split(' ')
            const eventParts = fn.split(' ')

            if (filterParts[0] !== eventParts[0]) return false

            if (filterParts.length > 1 && eventParts.length > 1) {
              const filterGroupName = filterParts[1]
              const eventGroupName = eventParts[1]

              return this.isSubgroupOf(
                eventGroupName,
                filterGroupName,
                group.train_prog
              )
            }
          })
        })
      })
    }

    return events
  }

  /**
   * Parses JSON data from server
   */
  static parse(jsonData: string | FlopEvent[]): CalendarEvent[] {
    try {
      const events: FlopEvent[] =
        typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData

      if (!Array.isArray(events)) {
        throw new Error('Expected an array of events')
      }

      return events.map((event) => this.parseEvent(event))
    } catch (error) {
      console.error('Error parsing JSON events:', error)
      throw new Error(
        `Failed to parse JSON events: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Checks if groupA is a subgroup of groupB
   */
  private static isSubgroupOf(
    groupA: string,
    groupB: string,
    promo: string
  ): boolean {
    // Handle promo-level groups (e.g., BUT3I includes all BUT3 subgroups)
    if (groupB.includes(promo)) return true

    // Handle exact match
    if (groupA === groupB) return true

    // Handle subgroup relationships
    // DV1.1 -> DV1 -> DV
    // A1 -> A
    // G1 doesn't have parent (it's a direct group)

    // Check if groupA starts with groupB (e.g., DV1.1 starts with DV1, DV1 starts with DV)
    if (groupA.startsWith(groupB)) {
      // Make sure it's a proper subgroup (not DV10 matching DV1)
      const remainder = groupA.substring(groupB.length)
      return (
        remainder === '' || remainder.startsWith('.') || /^\d/.test(remainder)
      )
    }

    // Handle special cases for TP groups (e.g., A1, A2 are subgroups of A)
    const baseGroupA = groupA.replace(/[.\d]+$/, '') // Remove trailing numbers and dots
    const baseGroupB = groupB.replace(/[.\d]+$/, '')

    if (baseGroupA === baseGroupB && groupA !== groupB) {
      // Check if A is actually a parent of A1 (A has no numbers, A1 has numbers)
      return groupA.length > groupB.length
    }

    // Check multi-level hierarchy (DV1.1 -> DV)
    if (baseGroupA.startsWith(baseGroupB) && baseGroupA !== baseGroupB) {
      return true
    }

    return false
  }

  /**
   * Extracts all unique groups organized hierarchically by promo from the data
   */
  static extractGroups(events: CalendarEvent[]): PromoGroups[] {
    try {
      // Collect all unique groups by promo
      const promoMap = new Map<
        string,
        Map<string, { id: number; name: string; train_prog: string }>
      >()

      events.forEach((event) => {
        event.groups?.forEach((group) => {
          const promo = group.train_prog
          if (!promoMap.has(promo)) {
            promoMap.set(promo, new Map())
          }

          const groupsForPromo = promoMap.get(promo)!
          const key = group.name
          if (!groupsForPromo.has(key)) {
            groupsForPromo.set(key, {
              id: group.id,
              name: group.name,
              train_prog: group.train_prog,
            })
          }
        })
      })

      // Build hierarchical structure
      const result: PromoGroups[] = []

      const sortedPromos = Array.from(promoMap.keys()).sort((a, b) => {
        if (a.startsWith('BUT') && b.startsWith('BUT')) {
          return a.localeCompare(b)
        }
        if (a.startsWith('BUT')) return -1
        if (b.startsWith('BUT')) return 1
        return a.localeCompare(b)
      })

      sortedPromos.forEach((promo) => {
        const groups = Array.from(promoMap.get(promo)!.values())
        const hierarchy = this.buildHierarchy(promo, groups)
        result.push({ promo, hierarchy })
      })

      return result
    } catch (error) {
      console.error('Error extracting groups:', error)
      throw new Error(
        `Failed to extract groups: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Builds a hierarchical structure from flat group list
   */
  private static buildHierarchy(
    promo: string,
    groups: Array<{ id: number; name: string; train_prog: string }>
  ): GroupHierarchy {
    const root: GroupHierarchy = {
      id: 0,
      name: promo,
      fullName: promo,
      level: 'promo',
      children: [],
    }

    // Find promo-level group (like BUT3I, BUT2I, BUT1)
    const promoGroup = groups.find(
      (g) => g.name === promo || g.name.includes(promo)
    )
    if (promoGroup) {
      root.id = promoGroup.id
      root.name = promoGroup.name
    }

    // Sort groups for proper hierarchy building
    const sortedGroups = groups
      .filter((g) => g.name !== promo && !g.name.includes(promo))
      .sort((a, b) => {
        // Sort by complexity (less complex first)
        const aComplexity = (a.name.match(/[.\d]/g) || []).length
        const bComplexity = (b.name.match(/[.\d]/g) || []).length
        if (aComplexity !== bComplexity) return aComplexity - bComplexity
        return a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      })

    // Build the hierarchy
    const addedGroups = new Set<string>()

    sortedGroups.forEach((group) => {
      if (addedGroups.has(group.name)) return

      const parts = group.name.split('.')
      let level: 'specialization' | 'group' | 'subgroup' = 'group'

      // Determine level based on naming pattern
      if (parts.length > 1 || /\d\.\d/.test(group.name)) {
        level = 'subgroup'
      } else if (['DV', 'RE', 'BD'].includes(group.name)) {
        level = 'specialization'
      } else if (/^[A-Z]\d?$/.test(group.name) || /^G\d$/.test(group.name)) {
        level = group.name.length === 1 ? 'group' : 'subgroup'
      }

      const node: GroupHierarchy = {
        id: group.id,
        name: group.name,
        fullName: `${promo} ${group.name}`,
        level,
        children: [],
      }

      // Find parent
      let parent = root

      // For subgroups, find their parent
      if (level === 'subgroup') {
        // Try to find direct parent (DV1 for DV1.1, A for A1)
        const possibleParents = [
          group.name.substring(0, group.name.lastIndexOf('.')), // DV1.1 -> DV1
          group.name.replace(/\.\d+$/, ''), // DV1.1 -> DV1
          group.name.replace(/\d+$/, ''), // A1 -> A, DV1 -> DV
          group.name.replace(/\d+\.\d+$/, ''), // DV1.1 -> DV
        ].filter((p) => p && p !== group.name)

        for (const parentName of possibleParents) {
          const existingParent = this.findInHierarchy(root, parentName)
          if (existingParent) {
            parent = existingParent
            break
          }
        }
      }

      // Add to parent's children
      if (!parent.children) parent.children = []
      parent.children.push(node)
      addedGroups.add(group.name)
    })

    // Sort children at each level
    this.sortHierarchy(root)

    return root
  }

  /**
   * Finds a node in the hierarchy by name
   */
  private static findInHierarchy(
    node: GroupHierarchy,
    name: string
  ): GroupHierarchy | null {
    if (node.name === name) return node
    if (node.children) {
      for (const child of node.children) {
        const found = this.findInHierarchy(child, name)
        if (found) return found
      }
    }
    return null
  }

  /**
   * Sorts children in the hierarchy
   */
  private static sortHierarchy(node: GroupHierarchy): void {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      )
      node.children.forEach((child) => this.sortHierarchy(child))
    }
  }

  /**
   * Gets all parent groups for a given group (for hierarchical filtering)
   */
  static getParentGroups(
    groupFullName: string,
    groups: PromoGroups[]
  ): string[] {
    const [promo, ...groupParts] = groupFullName.split(' ')
    if (groupParts.length === 0) return [groupFullName] // It's just a promo

    const groupName = groupParts.join(' ')
    const parentGroups: string[] = [groupFullName]

    // Add the promo itself
    parentGroups.push(promo)

    // Find the promo structure
    const promoStructure = groups.find((p) => p.promo === promo)
    if (!promoStructure) return parentGroups

    // Find all ancestors in hierarchy
    const findAncestors = (
      node: GroupHierarchy,
      targetName: string,
      ancestors: string[] = []
    ): string[] | null => {
      if (node.name === targetName) {
        return ancestors
      }

      if (node.children) {
        for (const child of node.children) {
          const result = findAncestors(child, targetName, [
            ...ancestors,
            node.fullName,
          ])
          if (result) return result
        }
      }

      return null
    }

    const ancestors = findAncestors(promoStructure.hierarchy, groupName)
    if (ancestors) {
      parentGroups.push(...ancestors)
    }

    // Also add potential intermediate groups based on naming patterns
    // E.g., for DV1.1, also include DV1 and DV
    if (groupName.includes('.')) {
      const parts = groupName.split('.')
      for (let i = parts.length - 1; i > 0; i--) {
        const parentName = parts.slice(0, i).join('.')
        parentGroups.push(`${promo} ${parentName}`)
      }
    }

    // For numbered groups (A1), include base group (A)
    const baseGroup = groupName.replace(/\d+$/, '')
    if (baseGroup !== groupName) {
      parentGroups.push(`${promo} ${baseGroup}`)
    }

    // For groups like DV1, also include DV
    const superGroup = groupName.replace(/\d+.*$/, '')
    if (superGroup !== groupName && superGroup !== baseGroup) {
      parentGroups.push(`${promo} ${superGroup}`)
    }

    // Remove duplicates and return
    return [...new Set(parentGroups)]
  }
}
