import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Sample events for demonstration purposes
  // Events data (empty for now)
  const events: any[] = [];

  // Function to check if a date has events
  const dateHasEvents = (day: Date) => {
    return events.some(event => 
      event.date.getDate() === day.getDate() && 
      event.date.getMonth() === day.getMonth() && 
      event.date.getFullYear() === day.getFullYear()
    );
  };

  // Get events for the selected date
  const getEventsForDate = (date?: Date) => {
    if (!date) return [];
    return events.filter(event => 
      event.date.getDate() === date.getDate() && 
      event.date.getMonth() === date.getMonth() && 
      event.date.getFullYear() === date.getFullYear()
    );
  };



  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "MMMM d, yyyy");
  };

  // Selected date events
  const selectedDateEvents = getEventsForDate(date);
  


  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Calendar</h1>
          <p className="text-gray-500">View and manage your schedule</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border"
                modifiersClassNames={{
                  selected: "bg-indigo-100 text-indigo-900 font-medium",
                }}
                components={{
                  DayContent: (props) => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {props.date.getDate()}
                      {dateHasEvents(props.date) && (
                        <div className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full"></div>
                      )}
                    </div>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}