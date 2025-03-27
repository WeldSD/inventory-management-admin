export async function GET() {
    try {
      console.log("Generating report on Vercel...");
  
      // Mock checked-out items (replace with actual data source)
      const checkedOutItems = [
        { name: "Item 1", overdue: false },
        { name: "Item 2", overdue: true },
        { name: "Item 3", overdue: false },
      ];
  
      // Generate Report Data
      const totalItems = checkedOutItems.length;
      const overdueItems = checkedOutItems.filter(item => item.overdue).length;
      const checkedOutRate = totalItems > 0 ? ((checkedOutItems.length / totalItems) * 100).toFixed(2) + "%" : "0%";
  
      // Return the report data as JSON
      return Response.json({
        totalItems,
        overdueItems,
        checkedOutRate,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      return Response.json({ error: "Failed to generate report" }, { status: 500 });
    }
  }
  