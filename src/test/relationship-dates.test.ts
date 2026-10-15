import { describe,it,expect } from 'vitest';
import { relationshipDates } from '@/lib/relationship-dates';
describe('relationship dates',()=>{
 it('uses elapsed calendar days and anniversary today',()=>expect(relationshipDates('2025-10-15',new Date(2026,9,15))).toEqual({daysTogether:365,daysUntil:0}));
 it('counts down across the year boundary',()=>expect(relationshipDates('2024-01-01',new Date(2026,11,31))).toEqual({daysTogether:1095,daysUntil:1}));
 it('celebrates leap day on February 28 in nonleap years',()=>expect(relationshipDates('2024-02-29',new Date(2025,1,28))).toEqual({daysTogether:365,daysUntil:0}));
 it('does not count future days together',()=>expect(relationshipDates('2027-01-01',new Date(2026,11,31)).daysTogether).toBe(0));
});
