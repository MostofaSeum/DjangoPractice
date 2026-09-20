import os
import json
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser

try:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Metric,
        RunReportRequest,
        RunRealtimeReportRequest,
    )
    from google.oauth2 import service_account
    GA_LIB_AVAILABLE = True
except ImportError:
    GA_LIB_AVAILABLE = False


class GA4LiveTrafficView(APIView):
    """
    Queries Google Analytics Data API (GA4) directly using Service Account credentials
    and returns real-time users, traffic channels, device breakdown, and top pages.
    Accessible by Admin users.
    """
    permission_classes = [IsAdminUser]

    def get_client_and_property(self):
        property_id = os.environ.get("GA4_PROPERTY_ID", "").strip()
        credentials_file = os.environ.get("GA4_CREDENTIALS_FILE", "google-analytics-credentials.json").strip()

        # Check full path or relative to backend
        creds_path = os.path.join(settings.BASE_DIR, credentials_file)
        if not os.path.exists(creds_path):
            # Check relative to BASE_DIR parent
            parent_path = os.path.join(settings.BASE_DIR.parent, credentials_file)
            if os.path.exists(parent_path):
                creds_path = parent_path
            else:
                return None, None, f"Credentials file not found at {creds_path}"

        if not property_id:
            return None, None, "GA4_PROPERTY_ID not configured"

        try:
            credentials = service_account.Credentials.from_service_account_file(creds_path)
            client = BetaAnalyticsDataClient(credentials=credentials)
            return client, property_id, None
        except Exception as e:
            return None, None, f"Error initializing GA4 client: {str(e)}"

    def get(self, request):
        if not GA_LIB_AVAILABLE:
            return Response(
                {"error": "google-analytics-data package is not installed on the server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        client, property_id, err = self.get_client_and_property()
        if err:
            return Response(
                {"is_configured": False, "message": err},
                status=status.HTTP_200_OK,
            )

        formatted_property = f"properties/{property_id}"
        days = request.query_params.get("days", "7")
        try:
            days_int = int(days)
        except ValueError:
            days_int = 7

        start_date_str = f"{days_int}daysAgo"

        # 1. Realtime active users (last 30 min)
        realtime_active_users = 0
        try:
            rt_req = RunRealtimeReportRequest(
                property=formatted_property,
                metrics=[Metric(name="activeUsers")],
            )
            rt_res = client.run_realtime_report(rt_req)
            if rt_res.rows:
                realtime_active_users = int(rt_res.rows[0].metric_values[0].value or 0)
        except Exception as e:
            print("GA4 Realtime query error:", e)

        # 2. Key totals (Active Users, Sessions, Page Views, Bounce Rate)
        total_active_users = 0
        total_sessions = 0
        total_screen_page_views = 0
        bounce_rate = 0.0

        try:
            overview_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                metrics=[
                    Metric(name="activeUsers"),
                    Metric(name="sessions"),
                    Metric(name="screenPageViews"),
                    Metric(name="bounceRate"),
                ],
            )
            overview_res = client.run_report(overview_req)
            if overview_res.rows:
                row = overview_res.rows[0]
                total_active_users = int(row.metric_values[0].value or 0)
                total_sessions = int(row.metric_values[1].value or 0)
                total_screen_page_views = int(row.metric_values[2].value or 0)
                bounce_rate = round(float(row.metric_values[3].value or 0) * 100, 1)
        except Exception as e:
            print("GA4 Overview query error:", e)

        # 3. Traffic Channel Grouping
        channels = []
        try:
            channel_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                dimensions=[Dimension(name="sessionDefaultChannelGroup")],
                metrics=[Metric(name="sessions"), Metric(name="activeUsers")],
            )
            channel_res = client.run_report(channel_req)
            channel_total_sessions = sum(int(r.metric_values[0].value or 0) for r in channel_res.rows) or 1
            for row in channel_res.rows:
                ch_name = row.dimension_values[0].value
                sess = int(row.metric_values[0].value or 0)
                pct = round((sess / channel_total_sessions) * 100, 1)
                channels.append({
                    "channel": ch_name,
                    "sessions": sess,
                    "percentage": pct,
                })
        except Exception as e:
            print("GA4 Channels query error:", e)

        # 4. Device Category
        devices = []
        try:
            device_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                dimensions=[Dimension(name="deviceCategory")],
                metrics=[Metric(name="activeUsers")],
            )
            device_res = client.run_report(device_req)
            device_total_users = sum(int(r.metric_values[0].value or 0) for r in device_res.rows) or 1
            for row in device_res.rows:
                dev_name = row.dimension_values[0].value.capitalize()
                dev_users = int(row.metric_values[0].value or 0)
                pct = round((dev_users / device_total_users) * 100, 1)
                devices.append({
                    "category": dev_name,
                    "users": dev_users,
                    "percentage": pct,
                })
        except Exception as e:
            print("GA4 Device query error:", e)

        # 5. Top Visited Pages
        top_pages = []
        try:
            pages_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                dimensions=[Dimension(name="pagePath"), Dimension(name="pageTitle")],
                metrics=[Metric(name="screenPageViews"), Metric(name="activeUsers")],
                limit=10,
            )
            pages_res = client.run_report(pages_req)
            for row in pages_res.rows:
                path = row.dimension_values[0].value
                title = row.dimension_values[1].value
                views = int(row.metric_values[0].value or 0)
                users = int(row.metric_values[1].value or 0)
                top_pages.append({
                    "path": path,
                    "title": title,
                    "views": views,
                    "users": users,
                })
        except Exception as e:
            print("GA4 Pages query error:", e)

        # 6. Daily Trend Data (for charts)
        daily_trends = []
        try:
            trend_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                dimensions=[Dimension(name="date")],
                metrics=[Metric(name="activeUsers"), Metric(name="screenPageViews")],
            )
            trend_res = client.run_report(trend_req)
            # Sort by date
            sorted_rows = sorted(trend_res.rows, key=lambda r: r.dimension_values[0].value)
            for row in sorted_rows:
                raw_date = row.dimension_values[0].value  # YYYYMMDD
                formatted_d = f"{raw_date[4:6]}/{raw_date[6:8]}" if len(raw_date) == 8 else raw_date
                users = int(row.metric_values[0].value or 0)
                pviews = int(row.metric_values[1].value or 0)
                daily_trends.append({
                    "date": formatted_d,
                    "users": users,
                    "views": pviews,
                })
        except Exception as e:
            print("GA4 Trend query error:", e)

        # 7. Recorded Event Telemetry Counts
        event_counts = {}
        try:
            events_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                dimensions=[Dimension(name="eventName")],
                metrics=[Metric(name="eventCount")],
            )
            events_res = client.run_report(events_req)
            for row in events_res.rows:
                ev_name = row.dimension_values[0].value
                cnt = int(row.metric_values[0].value or 0)
                event_counts[ev_name] = cnt
        except Exception as e:
            print("GA4 Events query error:", e)

        return Response({
            "is_configured": True,
            "property_id": property_id,
            "days": days_int,
            "realtime_active_users": realtime_active_users,
            "total_active_users": total_active_users,
            "total_sessions": total_sessions,
            "total_screen_page_views": total_screen_page_views,
            "bounce_rate": bounce_rate,
            "channels": channels,
            "devices": devices,
            "top_pages": top_pages,
            "daily_trends": daily_trends,
            "event_counts": event_counts,
        }, status=status.HTTP_200_OK)
