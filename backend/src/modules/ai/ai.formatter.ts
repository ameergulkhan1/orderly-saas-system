export class ResponseFormatter {
  static format(tool: string, data: any): string {
    const formatter = (this as any)[`format_${tool}`];
    if (typeof formatter === 'function') {
      return formatter.call(this, data);
    }
    return 'Done.';
  }

  static format_getHelp(): string {
    return (
      "I can help you with:\n" +
      "• Top products — \"What are my top products?\"\n" +
      "• Sales summary — \"How much did I sell this month?\"\n" +
      "• Low stock — \"What needs restocking?\"\n" +
      "• Pending orders — \"How many orders are pending?\"\n" +
      "• Customer stats — \"How many customers do I have?\"\n" +
      "• Revenue — \"Show me today's revenue\""
    );
  }

  static format_getSalesSummary(data: any): string {
    if (!data || data.orders === 0) {
      return `No delivered orders for ${data.period}.`;
    }
    return (
      `${this.capitalize(data.period)} you have ${data.orders} delivered orders ` +
      `with total revenue of Rs. ${data.revenue.toLocaleString()}. ` +
      `Average order value: Rs. ${Math.round(data.avgOrder).toLocaleString()}.`
    );
  }

  static format_getTopProducts(data: any): string {
    if (!data?.products?.length) {
      return `No product sales recorded for ${data.period}.`;
    }

    const lines = data.products.slice(0, 5).map((p: any, i: number) =>
      `${i + 1}. ${p.name} — ${p.units} units (Rs. ${p.revenue.toLocaleString()})`
    );

    return `Top products for ${data.period}:\n${lines.join('\n')}`;
  }

  static format_getLowStockProducts(data: any): string {
    if (!data?.products?.length) {
      return 'Good news — no products are low on stock.';
    }

    const lines = data.products.slice(0, 5).map((p: any) =>
      `• ${p.name} — ${p.currentStock} left`
    );

    return `⚠️ ${data.count} products need restocking:\n${lines.join('\n')}`;
  }

  static format_getPendingOrders(data: any): string {
    if (data.total === 0) {
      return 'You have no pending orders. 🎉';
    }

    const byStatus = (data.byStatus || [])
      .map((s: any) => `${s.count} ${s.status.toLowerCase().replace(/_/g, ' ')}`)
      .join(', ');

    return `You have ${data.total} pending orders (${byStatus}).`;
  }

  static format_getCustomerStats(data: any): string {
    const lines = [
      `Total customers: ${data.totalCustomers}`,
      `Repeat customers: ${data.repeatCustomers}`
    ];

    if (data.topSpenders?.length) {
      lines.push('Top spenders:');
      data.topSpenders.slice(0, 3).forEach((c: any, i: number) => {
        lines.push(`  ${i + 1}. ${c.name} — Rs. ${c.totalSpent.toLocaleString()}`);
      });
    }

    return lines.join('\n');
  }

  static format_getRevenueSummary(data: any): string {
    return (
      `Revenue overview:\n` +
      `• Today: Rs. ${data.today.revenue.toLocaleString()} (${data.today.orders} orders)\n` +
      `• This week: Rs. ${data.week.revenue.toLocaleString()} (${data.week.orders} orders)\n` +
      `• This month: Rs. ${data.month.revenue.toLocaleString()} (${data.month.orders} orders)\n` +
      `• This year: Rs. ${data.year.revenue.toLocaleString()} (${data.year.orders} orders)`
    );
  }

  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}