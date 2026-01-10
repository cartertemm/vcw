# Falsehoods About Time with Explanations

Explanations for all 112 things that programmers falsely believe about time.

## Background

This document explores common misconceptions programmers hold about time. Each "falsehood" represents an assumption that seems reasonable but fails in real-world scenarios. Based on the gist by Tim Visee: [Falsehoods programmers believe about time](https://gist.github.com/timvisee/fcda9bbdff88d45cc9061606b4b923ca).

## Falsehoods

### There are always 24 hours in a day.

Daylight Saving Time causes days to have 23 or 25 hours when clocks spring forward or fall back. Additionally, leap seconds can add an extra second to a day, and historical calendar reforms have caused days to be "skipped" entirely.

### February is always 28 days long.

Leap years add a 29th day to February. This occurs in years divisible by 4, except for years divisible by 100 (unless also divisible by 400). So 2000 had 29 days in February, but 1900 did not.

### Any 24-hour period will always begin and end in the same day (or week, or month).

A 24-hour period starting at 11 PM on January 31st ends at 11 PM on February 1st—spanning two days, two months, and potentially two years. During DST transitions, 24 hours of elapsed time may not even correspond to the same clock time the next day.

### A week always begins and ends in the same month.

A week starting on January 28th will end on February 3rd, spanning two months. This happens regularly at month boundaries.

### A week (or a month) always begins and ends in the same year.

The week containing December 31st extends into January of the next year. Similarly, fiscal years, academic years, and various cultural calendars may define years differently than the Gregorian calendar.

### The machine that a program runs on will always be in the GMT time zone.

Servers are deployed worldwide in various time zones. Cloud instances may be provisioned in any region. Even servers explicitly set to UTC may have their configuration changed by administrators or automation.

### Time zone won't change where a program operates.

Governments change time zone rules. Samoa skipped December 30, 2011 entirely when switching sides of the International Date Line. Russia has repeatedly changed its time zone policies. Your server could be migrated to a different data center.

### Production environments won't experience time zone changes.

Cloud providers may migrate workloads. Political decisions change time zones. Even if the server stays put, the rules for that time zone can change via OS updates.

### The system clock will always be set to the correct local time.

Clocks drift without NTP synchronization. Virtual machines may have clock skew. Misconfigured systems exist. Some systems intentionally run with incorrect times for testing or fraud.

### System clock stays reasonably close to actual time.

Systems without network access can drift significantly. VM suspension can cause massive jumps. Some embedded systems start from epoch (1970) on every boot until they sync.

### Clock inaccuracy remains consistent across seconds.

NTP adjustments can cause time to jump or slew at varying rates. Temperature affects crystal oscillator frequency. CPU load can affect timing on some systems.

### Server and client clocks synchronize perfectly.

Network latency, differing NTP sources, clock drift, and configuration differences mean server and client times will essentially never match exactly.

### Server and client clocks stay approximately aligned.

Mobile devices may have manually-set incorrect times. Embedded devices may lack network time sync. Users may intentionally set wrong times to exploit time-based features.

### Server and client clocks won't differ by decades.

Devices with dead CMOS batteries reset to 1970 or 2000. Some systems default to their firmware build date. Users may set dates far in the future to bypass trial software limits.

### Clock drift between systems stays uniform.

Different hardware has different oscillator characteristics. Temperature variations affect drift rates. NTP correction intervals vary. Some systems use GPS time while others use internet NTP.

### Server and client use identical time zones.

Users travel internationally. Servers are deployed globally. Users may prefer UTC for coordination. Mobile devices may be set to home time zones while traveling.

### System clock never deviates into distant past/future.

Hardware failures can cause arbitrary time values. Malicious actors may manipulate time. Testing scenarios require time manipulation. Y2K and Y2038 bugs demonstrate this danger.

### Time has no beginning and no end.

Unix timestamps began January 1, 1970. Many systems cannot represent dates before this. 32-bit timestamps end in 2038. Various database and language-specific limits exist. Some systems start at 1601 or 1900.

### One minute on the system clock has exactly the same duration as one minute on any other clock.

Clock slewing for NTP adjustment stretches or compresses time. Leap seconds add time. Different time systems (TAI, UT1, UTC) define seconds differently. Relativity means moving clocks tick differently.

### System clock minute duration approximates other clocks.

Large NTP step corrections can make a "minute" instant or take two minutes of wall-clock time. VM suspend/resume causes massive jumps.

### System clock minute variance stays under one hour.

System hibernation can pause the clock indefinitely. VM migration can cause jumps. Manual administrator changes can adjust time arbitrarily.

### The smallest unit of time is one second.

Most systems support millisecond or microsecond precision. High-frequency trading requires nanoseconds. Hardware timers often provide sub-microsecond resolution.

### The smallest unit is one millisecond.

Many languages support microseconds or nanoseconds. JavaScript's performance.now() provides sub-millisecond precision. Real-time systems need finer granularity.

### System time adjustments only occur during testing.

NTP continuously adjusts time in production. Leap second insertions happen in production. Manual corrections occur when major drift is detected.

### Production never requires manual system time changes.

Recovering from major NTP failures may require manual intervention. Forensic analysis may require time adjustments. Some regulatory requirements mandate specific time source changes.

### Timestamps follow universally recognized formats.

ISO 8601, Unix timestamps, Windows FILETIME, Excel serial dates, Julian dates, and countless proprietary formats exist. Regional preferences for MM/DD vs DD/MM cause endless confusion.

### Time stamps will always be specified in the same format.

Different systems, APIs, log files, and databases use different formats. Even within one system, format changes happen during upgrades. User-facing vs. internal formats differ.

### Timestamps maintain consistent precision.

Some fields store seconds, others milliseconds, others microseconds. Older logs may have lower precision than newer ones. Different sources provide different precision levels.

### Sufficiently precise timestamps remain unique.

Multi-threaded systems can generate identical timestamps. Distributed systems may have synchronized clocks generating same values. Fast loops can produce duplicates even at nanosecond precision.

### Timestamps represent actual event occurrence times.

Events are logged after they occur. Network delays add latency. Batch processing may timestamp when processed, not when occurred. Clock skew means timestamps are approximations.

### Human-readable dates can be specified in universally understood formats such as 05/07/11.

This could be May 7, 2011 (US), July 5, 2011 (Europe), or July 11, 2005 (ISO-ish). Without context, such formats are ambiguous. Cultural and regional variations make universal interpretation impossible.

### The offsets between two time zones will remain constant.

DST changes cause offsets to shift twice yearly. Countries change their time zone rules. Egypt suspended DST with days' notice. Some countries change time zones entirely.

### Future time zone offsets won't change.

Governments routinely change DST rules. The EU discussed abolishing DST. Countries adopt or abandon DST with varying notice. Long-term scheduling cannot assume current rules.

### Time zone offset changes receive advance notification.

Morocco changed DST rules with 24 hours notice. Some countries announce changes weeks before implementation. IANA tzdata updates may lag behind political decisions.

### Daylight saving time happens at the same time every year.

US DST rules changed in 2007. Australia has different rules for different states. Countries adjust DST timing based on energy policy, religious observances, or other factors.

### Daylight saving time happens at the same time in every time zone.

Each jurisdiction sets its own DST rules. Northern and Southern hemispheres have opposite DST schedules. Some countries don't observe DST at all. Even within countries, different regions may differ.

### Daylight saving time always adjusts by an hour.

Lord Howe Island, Australia shifts by only 30 minutes. Historically, some regions used 2-hour shifts. During WWII, "Double Summer Time" was used in the UK.

### Months have either 28, 29, 30, or 31 days.

Calendar reforms have created months with different lengths. The Julian-to-Gregorian switch caused days to be skipped. Different calendars (Hebrew, Islamic) have varying month lengths including months that change year-to-year.

### The day of the month always advances contiguously from N to either N+1 or 1, with no discontinuities.

When countries adopted the Gregorian calendar, days were skipped. October 1582 went from the 4th to the 15th in Catholic countries. Russia didn't switch until 1918, skipping 13 days.

### There is only one calendar system in use at one time.

Hebrew, Islamic, Chinese, Thai Buddhist, Japanese Imperial, and other calendars are in active use. Religious observances, official government documents, and cultural practices use different systems simultaneously.

### There is a leap year every year divisible by 4.

Years divisible by 100 are not leap years, unless also divisible by 400. So 1900 was not a leap year, but 2000 was. This catches many date libraries off guard.

### Non leap years will never contain a leap day.

The Julian-to-Gregorian transition created situations where leap days appeared in unexpected years for countries switching. Historical calendars had different leap year rules.

### Calculating duration from specific times proves straightforward.

DST transitions, leap seconds, calendar reforms, and time zone changes all complicate duration calculations. A "day" starting before DST ends at a different clock time than it started.

### The same month has the same number of days in it everywhere!

Due to time zones, it can be February 28th in one location and March 1st in another. During historical calendar transitions, different countries had different month lengths at the same moment.

### Unix time is completely ignorant about anything except seconds.

Modern implementations often include milliseconds or microseconds. The interpretation of Unix time for display depends on locale and timezone. Leap second handling varies by system.

### Unix time is the number of seconds since Jan 1st 1970.

Unix time explicitly ignores leap seconds, so it's not a true count of SI seconds. It's the number of non-leap seconds, making each UTC day exactly 86400 Unix seconds regardless of leap seconds.

### The day before Saturday is always Friday.

When Samoa skipped December 30, 2011, Thursday was followed directly by Saturday. Historical calendar reforms similarly skipped days. In some contexts, "day before" could refer to business days.

### Contiguous timezones are no more than an hour apart.

Crossing the International Date Line changes the date by 24 hours. China uses a single time zone despite spanning five geographical zones. Political boundaries create large offsets between adjacent areas.

### Two timezones that differ will differ by an integer number of half hours.

Nepal is UTC+5:45. Iran is UTC+3:30. India is UTC+5:30. Parts of Australia use UTC+9:30. These 45-minute and 30-minute offsets are common.

### Time zones differ by quarter hours.

Nepal's UTC+5:45 offset demonstrates that time zones can differ by 15-minute increments that aren't quarter hours from UTC, and historically, even stranger offsets existed.

### Time zones maintain consistent differences ignoring DST.

Political decisions change base time zone offsets. Countries split or merge time zones. Venezuela shifted by 30 minutes in 2007, then back in 2016.

### Adjacent date objects represent identical times.

Two Date objects created moments apart in different threads may have identical timestamps or different ones depending on resolution and system load. Object identity doesn't equal time identity.

### Waiting for exact time works via one-second sampling.

You might miss the exact second if your sampling interval is one second. Busy systems might delay your check. NTP adjustments might cause you to see the same second twice or skip one.

### Process duration matches elapsed system clock time.

System sleep/hibernate pauses processes but not wall-clock time. NTP adjustments change elapsed clock time. CPU throttling and scheduling affect perceived duration. VM migration causes discontinuities.

### Weeks start on Monday.

In the US, weeks traditionally start on Sunday. In the Middle East, weeks often start on Saturday. ISO 8601 defines Monday as the first day, but not all systems follow this.

### Days begin in the morning.

Jewish, Islamic, and some other calendars start days at sunset. Astronomical days traditionally began at noon. Different cultural and religious contexts define day boundaries differently.

### Holidays span an integer number of whole days.

Some holidays begin at sundown (Hanukkah, Passover). Half-day holidays exist in many cultures. Bank holiday cutoffs may be mid-day. Trading sessions can create partial holiday scenarios.

### The weekend consists of Saturday and Sunday.

In many Middle Eastern countries, the weekend is Friday and Saturday. Some countries have single-day weekends. Shifts in work weeks have occurred (Nepal changed in 2012).

### Establishing total timestamp ordering works universally.

Distributed systems cannot achieve perfect ordering without trade-offs (CAP theorem). Light-speed delays make simultaneous events ambiguous. Clock skew means timestamps don't reflect true order.

### Local UTC offset stays constant during business hours.

Some DST transitions occur during business hours in various time zones. Unusual political decisions have changed offsets mid-day. Even defined DST transitions happen at 2 AM, which is business hours somewhere.

### Thread.sleep(1000) sleeps for 1000 milliseconds.

Sleep granularity varies by OS (Windows historically had 15.6ms granularity). System load affects actual sleep duration. The thread may sleep longer waiting for CPU availability. It's a minimum, not exact.

### Thread.sleep(1000) sleeps for >= 1000 milliseconds.

Spurious wakeups can occur on some platforms. Signal interruption may cause early return. System clock adjustments during sleep affect measured duration.

### There are 60 seconds in every minute.

Leap seconds add a 61st second to some minutes (23:59:60). Historically, negative leap seconds (59-second minutes) are possible though never used. Some time representations smear leap seconds across longer periods.

### Timestamps always advance monotonically.

NTP step corrections can move time backward. Leap second handling can repeat a second. Manual clock adjustments go backward. Switching from local time to UTC during DST can appear to go backward.

### GMT and UTC are the same timezone.

GMT is a time zone tied to mean solar time at Greenwich. UTC is a time standard based on atomic clocks. They can differ by up to 0.9 seconds. GMT observes British Summer Time in the UK; UTC never changes.

### Britain uses GMT.

Britain uses GMT only in winter. During summer, Britain observes British Summer Time (BST), which is UTC+1. The UK time zone is actually Europe/London, not GMT.

### Time always goes forwards.

DST "fall back" repeats an hour. Leap second handling can repeat seconds. NTP corrections can move time backward. Different clock sources (GPS, network, local) can cause apparent backward jumps.

### The difference between the current time and one week from the current time is always 7 * 86400 seconds.

DST transitions add or remove an hour. Leap seconds add seconds. The calculation is 604800 seconds normally, but can be 601200, 604801, or 608400 depending on the week.

### Timestamp differences accurately measure elapsed time.

Clock drift, NTP adjustments, leap seconds, and DST all cause timestamp differences to diverge from actual elapsed time. Only monotonic clocks accurately measure duration.

### 24:12:34 is an invalid time.

ISO 8601 allows 24:00:00 to represent midnight at the end of a day. Japanese television and transport schedules use times like 25:30 to indicate 1:30 AM the next day. Various systems extend hours beyond 24.

### Every integer is a theoretical possible year.

Year 0 doesn't exist in the traditional Gregorian calendar (1 BC is followed by 1 AD). Some systems can't represent negative years. Many systems have minimum/maximum years (1-9999 is common).

### Displayed time matches stored time's second value.

Timezone conversion changes the displayed time. Rounding for display may hide precision. Formatting choices may truncate or modify displayed values.

### Displayed time shares stored time's year.

A UTC time on December 31st at 23:00 displays as January 1st in timezones UTC+2 or higher. The year changes with the date during timezone conversion.

### Display/storage year difference stays below 2.

While rare with current timezones, historical timezone oddities and calendar conversions can create larger differences. Converting from Julian to Gregorian calendars can shift dates by weeks.

### YYYY-MM-DD format years always contain four characters.

Years before 1000 have fewer digits (0099-01-01). Years after 9999 need five digits. Astronomical year numbering includes year 0 and negative years (-0044 for 45 BC).

### Merging month from one date with day/year from another creates validity.

February (from Date A) combined with day 31 (from Date B) is invalid. Leap year February 29th combined with a non-leap year is invalid. Month and day must be validated together.

### Merging dates works if both years are leap years.

Even if both years are leap years, February 29 combined with April 31 is still invalid. The year being a leap year doesn't make all day combinations valid.

### W3C duration-addition algorithms work universally.

Adding "1 month" to January 31st is ambiguous (February 31st doesn't exist). Duration arithmetic depends on the starting point. Different implementations handle edge cases differently.

### Standard libraries support years below 0 and above 10000.

Many libraries restrict years to 1-9999. JavaScript's Date has issues with years near 0. Some databases limit year ranges. BCE dates are often unsupported or handled incorrectly.

### Time zones always differ by a whole hour.

India (UTC+5:30), Nepal (UTC+5:45), Iran (UTC+3:30), Myanmar (UTC+6:30), and many other zones use fractional hour offsets. Even 15-minute offsets exist.

### Millisecond precision loss under 0.5 stays ignorable.

Accumulated rounding errors add up over many operations. High-frequency applications need consistent precision. Financial systems may have regulatory requirements for precision.

### Two-digit years should be somewhere in the range 1900-2099.

Historical data includes earlier dates. Future dates beyond 2099 are increasingly relevant. Different systems use different pivot years (50, 30, etc.) for interpretation.

### Date-time parsing progresses sequentially without backtracking.

Ambiguous formats like "2023-1-2" could be January 2nd or parsed differently depending on expected format. Parsers may need to backtrack when a parse path fails.

### Date-time output progresses sequentially without backtracking.

Some formats require calculating derived values (day of year, week number) that depend on complete date information. Localization may require reordering components.

### Never parsing formats like ---12Z or P12Y34M56DT78H90M12.345S.

ISO 8601 allows partial dates like ---12 (day 12 of unspecified month/year). XML Schema uses P#Y#M#D format for durations. These formats appear in APIs, data exchange, and configuration files.

### There are only 24 time zones.

There are over 300 time zones in the IANA database. Historical zones add thousands more. Political boundaries, DST rules, and historical changes create far more than 24 distinct timekeeping regions.

### Time zones are always whole hours away from UTC.

India (UTC+5:30), Nepal (UTC+5:45), Iran (UTC+3:30), Afghanistan (UTC+4:30), and others demonstrate that half-hour and 45-minute offsets are common.

### Daylight Saving Time (DST) starts/ends on the same date everywhere.

Northern and Southern hemispheres have opposite DST schedules. The US and EU transition on different dates. Even within the EU, DST changes are under debate for potential elimination.

### DST is always an advancement by 1 hour.

Lord Howe Island uses 30-minute DST. Historical "double summer time" used 2-hour shifts. Some proposals have suggested different increment sizes.

### Client clock comparison determines time zone accurately.

Multiple timezones share the same offset at any given moment. DST makes timezone detection from offset alone impossible. Users may be traveling or have manually set times.

### Software automatically adjusts for timezone/DST.

Software must be explicitly programmed to handle time zones. Outdated tzdata causes errors. Different platforms handle DST differently. Naive datetime implementations ignore time zones entirely.

### Internal/local-only software avoids time zone concerns.

Logs become confusing after DST transitions. Data imported from other sources may have different time zones. Users may access the system while traveling. Backups and restores cross time boundaries.

### Software stacks handle time zone/DST automatically.

Different layers may have different tzdata versions. Database, application, and display layers may interpret times differently. Edge cases around transitions often break.

### Maintaining custom time zone lists proves feasible.

Governments change time zone rules with little notice. The IANA tzdata database is updated frequently. Historical accuracy requires extensive data. Custom lists quickly become stale.

### All clock measurements share the same reference frame.

GPS time, TAI, UT1, and UTC are different time standards. Each has different properties and use cases. Relativistic effects mean clocks in different gravitational potentials or moving at different speeds tick differently.

### Date functions working now apply to any date.

Historical dates used different calendars. Future dates may be affected by rule changes. DST rules have changed over time. What's valid today may not have been valid in 1900 or may not be valid in 2100.

### Years have 365 or 366 days.

Calendar reform transitions created years with different lengths. When Britain adopted the Gregorian calendar in 1752, that year had only 355 days. Different calendars have different year lengths.

### Each calendar date is followed by the next in sequence, without skipping.

The Gregorian calendar adoption caused countries to skip 10-13 days. Future calendar reforms could create similar discontinuities. Some historical calendars had variable year lengths.

### Date/time unambiguously identifies unique moments.

During DST "fall back," the same local time occurs twice. Without timezone information, dates are ambiguous. Historical dates may be Julian or Gregorian. Some timestamp formats are inherently ambiguous.

### Leap years occur every 4 years.

Years divisible by 100 are not leap years (except those divisible by 400). The year 1900 was not a leap year. This creates a 400-year cycle, not a simple 4-year cycle.

### You can determine the time zone from the state/province.

Some US states span multiple time zones (Texas, Florida, Idaho, etc.). Australian states have varying DST rules. Indiana historically had counties in different zones.

### You can determine the time zone from the city/town.

Cities near zone boundaries may be ambiguous. Historical zone changes mean past times had different zones. Some cities have changed zones. Cities may span zone boundaries.

### Time passes at the same speed on top of a mountain and at the bottom of a valley.

General relativity shows that clocks run faster at higher altitudes due to weaker gravitational fields. GPS satellites must account for this effect. Atomic clocks can measure this difference.

### One hour is as long as the next in all time systems.

Sundial hours varied with seasons in ancient times. Leap second smearing stretches or compresses seconds. Relativistic time dilation affects duration measurement.

### You can calculate when leap seconds will be added.

Leap seconds are announced only about 6 months in advance by the IERS. They depend on Earth's unpredictable rotational variations. Long-term scheduling cannot account for them.

### Current time function precision matches its accuracy.

A function may return nanoseconds but only be accurate to milliseconds. NTP provides millisecond accuracy at best. High-precision timestamps may have low accuracy.

### Subsequent getCurrentTime() calls return distinct results.

Fast systems may call faster than clock resolution. Timer granularity on some systems is 15-16 milliseconds. Caching may return same value for performance.

### Second getCurrentTime() call returns larger result.

NTP step corrections can move time backward between calls. DST transitions can cause apparent backward movement. Thread scheduling and clock source changes can cause non-monotonic behavior.

### The software will never run on a space ship that is orbiting a black hole.

While extreme, long-lived software may encounter scenarios not originally anticipated. More practically, deep space missions, satellite systems, and GPS must account for relativistic effects.

### Devices will be set to the local timezone.

Users may prefer UTC. Travelers may keep home time. Corporate policies may mandate specific time zones. Some users set wrong time zones intentionally.

### Users prefer to use the local timezone.

Developers often prefer UTC. International teams coordinate in UTC. Travelers may want home time. Some users find UTC easier for global coordination.
