import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CustomCalendar({
  visible,
  onClose,
  onSelectRange,
  startDate,
  endDate,
  inline,
}) {
  const [viewDate, setViewDate] = useState(startDate || new Date());
  const [activeTab, setActiveTab] = useState("Year");
  const [showYearPicker, setShowYearPicker] = useState(false);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getDaysInMonth = (month, year) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const changeMonth = (increment) => {
    const newDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + increment,
      1,
    );
    setViewDate(newDate);
  };

  const handleDayPress = (day) => {
    const clickedDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      day,
    );

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onSelectRange(clickedDate, null, "custom");
      setActiveTab("Month"); // Default back to grid view if they pick a date
    } else {
      // Selecting end date
      if (clickedDate < startDate) {
        // If clicked earlier date, make it the new start
        onSelectRange(clickedDate, null, "custom");
        setActiveTab("Month");
      } else {
        onSelectRange(startDate, clickedDate, "custom");
        setActiveTab("Month");
      }
    }
  };

  const isSameDay = (d1, d2) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isInRange = (date) => {
    if (!startDate || !endDate) return false;
    return date > startDate && date < endDate;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(
      viewDate.getMonth(),
      viewDate.getFullYear(),
    );
    const firstDay = getFirstDayOfMonth(
      viewDate.getMonth(),
      viewDate.getFullYear(),
    );
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        i,
      );
      const isStart = startDate && isSameDay(currentDay, startDate);
      const isEnd = endDate && isSameDay(currentDay, endDate);
      const inRange = isInRange(currentDay);

      const isToday = isSameDay(new Date(), currentDay);

      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dayCell,
            isStart && styles.selectedDayCell,
            isEnd && styles.selectedDayCell,
            inRange && styles.rangeDayCell,
            isToday && !isStart && !isEnd && !inRange && styles.todayCell,
          ]}
          onPress={() => handleDayPress(i)}
        >
          <Text
            style={[
              styles.dayText,
              (isStart || isEnd) && styles.selectedDayText,
              inRange && styles.rangeDayText,
              isToday && !isStart && !isEnd && !inRange && styles.todayText,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>,
      );
    }

    return days;
  };

  const renderYearPicker = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Show 20 years back and 10 years forward as requested "previous and upcoming"
    for (let i = currentYear - 20; i <= currentYear + 10; i++) {
      years.push(i);
    }

    return (
      <View style={styles.yearPickerContainer}>
        <View style={styles.yearPickerHeader}>
          <Text style={styles.yearPickerTitle}>Select Year</Text>
          <TouchableOpacity onPress={() => setShowYearPicker(false)}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={styles.yearList}
          showsVerticalScrollIndicator={false}
        >
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearItem,
                viewDate.getFullYear() === year && styles.activeYearItem,
              ]}
              onPress={() => {
                const newDate = new Date(viewDate);
                newDate.setFullYear(year);
                setViewDate(newDate);
                setShowYearPicker(false);
              }}
            >
              <Text
                style={[
                  styles.yearText,
                  viewDate.getFullYear() === year && styles.activeYearText,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const selectPresetRange = (type) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (type) {
      case "Today":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "Week":
        const day = now.getDay();
        start.setDate(now.getDate() - day);
        end.setDate(now.getDate() + (6 - day));
        break;
      case "Month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "Year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    setViewDate(start);
    setActiveTab(type);
    onSelectRange(start, end, type.toLowerCase());
  };

  const CalendarComponent = (
    <View style={[styles.calendarContainer, inline && styles.inlineContainer]}>
      {/* Sidebar */}
      <View style={[styles.sidebar, inline && styles.inlineSidebar]}>
        {["Today", "Week", "Month", "Year"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.sidebarTab,
              activeTab === tab && styles.activeSidebarTab,
              inline && styles.inlineSidebarTab,
            ]}
            onPress={() => {
              setActiveTab(tab);
              selectPresetRange(tab);
            }}
          >
            <Text
              style={[
                styles.sidebarText,
                activeTab === tab && styles.activeSidebarText,
                inline && { fontSize: 13 },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calendar Content */}
      <View
        style={[styles.calendarContent, inline && styles.inlineCalendarContent]}
      >
        {showYearPicker ? (
          renderYearPicker()
        ) : (
          <>
            {/* Header */}
            <View style={{ flex: 1 }}>
              <View style={[styles.header, inline && { marginBottom: 16 }]}>
                <TouchableOpacity
                  onPress={() => changeMonth(-1)}
                  style={styles.navButton}
                >
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowYearPicker(true)}>
                  <Text
                    style={[styles.headerTitle, inline && { fontSize: 15 }]}
                  >
                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => changeMonth(1)}
                  style={styles.navButton}
                >
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Days Grid */}
              <View style={styles.daysHeader}>
                {weekDays.map((day) => (
                  <Text
                    key={day}
                    style={[styles.weekDayText, inline && { width: 25 }]}
                  >
                    {day}
                  </Text>
                ))}
              </View>
              <View style={styles.daysGrid}>{renderCalendarDays()}</View>
            </View>
          </>
        )}
      </View>
    </View>
  );

  if (inline) {
    return CalendarComponent;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        {CalendarComponent}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  calendarContainer: {
    flexDirection: "row",
    backgroundColor: "#1E212E",
    borderRadius: 24,
    overflow: "hidden",
    width: Platform.OS === "web" ? 550 : "95%",
    height: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  inlineContainer: {
    width: "100%",
    height: "auto",
    minHeight: 330,
    borderRadius: 12,
    shadowOpacity: 0,
    elevation: 0,
    marginTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  sidebar: {
    width: 110,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
  },
  inlineSidebar: {
    width: 80,
  },
  sidebarTab: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  inlineSidebarTab: {
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  activeSidebarTab: {
    backgroundColor: "rgba(168, 85, 247, 0.08)",
    borderLeftColor: "#A855F7",
  },
  sidebarText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "600",
  },
  activeSidebarText: {
    color: "#A855F7",
  },
  calendarContent: {
    flex: 1,
    padding: 24,
  },
  inlineCalendarContent: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  navButton: {
    padding: 8,
  },
  daysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weekDayText: {
    color: "#64748B",
    fontSize: 13,
    width: 40,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  dayText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  selectedDayCell: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#A855F7",
  },
  selectedDayText: {
    color: "#A855F7",
    fontWeight: "bold",
  },
  rangeDayCell: {
    backgroundColor: "rgba(168, 85, 247, 0.08)",
  },
  rangeDayText: {
    color: "#FFFFFF",
  },
  todayCell: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 25,
  },
  todayText: {
    fontWeight: "bold",
  },
  yearPickerContainer: {
    flex: 1,
  },
  yearPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  yearPickerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  yearList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  yearItem: {
    width: "30%",
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: "1.5%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  activeYearItem: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderColor: "#A855F7",
    borderWidth: 1,
  },
  yearText: {
    color: "#CBD5E1",
    fontSize: 14,
  },
  activeYearText: {
    color: "#A855F7",
    fontWeight: "bold",
  },
});
