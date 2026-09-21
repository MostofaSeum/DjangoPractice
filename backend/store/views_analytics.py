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
        credentials_json_str = os.environ.get("GA4_CREDENTIALS_JSON", "").strip()
        credentials_file = os.environ.get("GA4_CREDENTIALS_FILE", "google-analytics-credentials.json").strip()

        if not property_id:
            return None, None, "GA4_PROPERTY_ID environment variable is not configured"

        # 1. First priority: Direct JSON content in Environment Variable (best for Render/Cloud)
        if credentials_json_str:
            try:
                creds_dict = json.loads(credentials_json_str)
                credentials = service_account.Credentials.from_service_account_info(creds_dict)
                client = BetaAnalyticsDataClient(credentials=credentials)
                return client, property_id, None
            except Exception as e:
                return None, None, f"Error parsing GA4_CREDENTIALS_JSON: {str(e)}"

        # 2. Second priority: Local file or Render Secret File
        creds_path = credentials_file if os.path.isabs(credentials_file) else os.path.join(settings.BASE_DIR, credentials_file)
        if not os.path.exists(creds_path):
            # Check relative to BASE_DIR parent
            parent_path = os.path.join(settings.BASE_DIR.parent, credentials_file)
            if os.path.exists(parent_path):
                creds_path = parent_path
            else:
                return None, None, f"Credentials file not found at {creds_path}. Please add GA4_CREDENTIALS_JSON or GA4_CREDENTIALS_FILE in Render Environment Variables."

        try:
            credentials = service_account.Credentials.from_service_account_file(creds_path)
            client = BetaAnalyticsDataClient(credentials=credentials)
            return client, property_id, None
        except Exception as e:
            return None, None, f"Error initializing GA4 client from file: {str(e)}"

    def get(self, request):
        if not GA_LIB_AVAILABLE:
            return Response(
                {
                    "is_configured": False,
                    "error_type": "missing_package",
                    "message": "google-analytics-data package is not installed on the server. To view real-time Google telemetry directly in this tab, install google-analytics-data in your backend requirements and configure a Google Cloud Service Account.",
                },
                status=status.HTTP_200_OK,
            )

        client, property_id, err = self.get_client_and_property()
        if err:
            return Response(
                {
                    "is_configured": False,
                    "error_type": "missing_credentials",
                    "message": err,
                },
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

        # 2. Key totals (Active Users, Sessions, Page Views, Bounce Rate, Engagement Time, Screen Page Views per Session)
        total_active_users = 0
        total_sessions = 0
        total_screen_page_views = 0
        bounce_rate = 0.0
        avg_session_duration = 0.0
        views_per_session = 0.0

        try:
            overview_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                metrics=[
                    Metric(name="activeUsers"),
                    Metric(name="sessions"),
                    Metric(name="screenPageViews"),
                    Metric(name="bounceRate"),
                    Metric(name="averageSessionDuration"),
                    Metric(name="screenPageViewsPerSession"),
                ],
            )
            overview_res = client.run_report(overview_req)
            if overview_res.rows:
                row = overview_res.rows[0]
                total_active_users = int(row.metric_values[0].value or 0)
                total_sessions = int(row.metric_values[1].value or 0)
                total_screen_page_views = int(row.metric_values[2].value or 0)
                bounce_rate = round(float(row.metric_values[3].value or 0) * 100, 1)
                avg_session_duration = round(float(row.metric_values[4].value or 0), 1)
                views_per_session = round(float(row.metric_values[5].value or 0), 2)
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

        # 8. Feature 1: Geographic / City Breakdown (Dhaka, Chittagong, etc.)
        cities = []
        try:
            city_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                dimensions=[Dimension(name="city"), Dimension(name="country")],
                metrics=[Metric(name="activeUsers"), Metric(name="sessions")],
                limit=10,
            )
            city_res = client.run_report(city_req)
            city_total_users = sum(int(r.metric_values[0].value or 0) for r in city_res.rows) or 1
            for row in city_res.rows:
                city_name = row.dimension_values[0].value
                country_name = row.dimension_values[1].value
                if city_name == "(not set)":
                    city_name = "Unknown / Other"
                u_count = int(row.metric_values[0].value or 0)
                s_count = int(row.metric_values[1].value or 0)
                cities.append({
                    "city": city_name,
                    "country": country_name,
                    "users": u_count,
                    "sessions": s_count,
                    "percentage": round((u_count / city_total_users) * 100, 1),
                })
        except Exception as e:
            print("GA4 Cities query error:", e)

        # 9. Feature 3: Traffic Acquisition & Campaign Attribution (sessionSourceMedium)
        traffic_sources = []
        try:
            source_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                dimensions=[Dimension(name="sessionSourceMedium")],
                metrics=[Metric(name="sessions"), Metric(name="activeUsers")],
                limit=10,
            )
            source_res = client.run_report(source_req)
            source_total_sessions = sum(int(r.metric_values[0].value or 0) for r in source_res.rows) or 1
            for row in source_res.rows:
                src_name = row.dimension_values[0].value
                s_count = int(row.metric_values[0].value or 0)
                u_count = int(row.metric_values[1].value or 0)
                traffic_sources.append({
                    "source_medium": src_name,
                    "sessions": s_count,
                    "users": u_count,
                    "percentage": round((s_count / source_total_sessions) * 100, 1),
                })
        except Exception as e:
            print("GA4 Sources query error:", e)

        # 10. Feature 5: Hourly Peak Shopping Times (Hour 0 to 23 distribution)
        hourly_traffic = []
        try:
            hour_req = RunReportRequest(
                property=formatted_property,
                date_ranges=[DateRange(start_date=start_date_str, end_date="today")],
                dimensions=[Dimension(name="hour")],
                metrics=[Metric(name="activeUsers"), Metric(name="sessions")],
            )
            hour_res = client.run_report(hour_req)
            hour_dict = {f"{h:02d}": {"users": 0, "sessions": 0} for h in range(24)}
            for row in hour_res.rows:
                h_str = str(row.dimension_values[0].value).zfill(2)
                if h_str in hour_dict:
                    hour_dict[h_str]["users"] += int(row.metric_values[0].value or 0)
                    hour_dict[h_str]["sessions"] += int(row.metric_values[1].value or 0)
            for h in range(24):
                h_key = f"{h:02d}"
                hourly_traffic.append({
                    "hour": h_key,
                    "label": f"{h}:00",
                    "users": hour_dict[h_key]["users"],
                    "sessions": hour_dict[h_key]["sessions"],
                })
        except Exception as e:
            print("GA4 Hourly query error:", e)

        # 11. Feature 2: E-Commerce Conversion Drop-Off Funnel
        # Steps: view_item -> add_to_cart -> begin_checkout -> purchase
        view_item_count = event_counts.get("view_item", 0)
        cart_count = event_counts.get("add_to_cart", 0)
        checkout_count = event_counts.get("begin_checkout", 0)
        purchase_count = event_counts.get("purchase", 0)

        funnel_steps = [
            {
                "step": "view_item",
                "label": "Product Views",
                "count": view_item_count,
                "conversion_rate": 100.0,
                "dropoff_rate": 0.0,
            },
            {
                "step": "add_to_cart",
                "label": "Added to Cart",
                "count": cart_count,
                "conversion_rate": round((cart_count / view_item_count * 100), 1) if view_item_count > 0 else 0.0,
                "dropoff_rate": round((100 - (cart_count / view_item_count * 100)), 1) if view_item_count > 0 else 0.0,
            },
            {
                "step": "begin_checkout",
                "label": "Initiated Checkout",
                "count": checkout_count,
                "conversion_rate": round((checkout_count / cart_count * 100), 1) if cart_count > 0 else 0.0,
                "dropoff_rate": round((100 - (checkout_count / cart_count * 100)), 1) if cart_count > 0 else 0.0,
            },
            {
                "step": "purchase",
                "label": "Completed Orders",
                "count": purchase_count,
                "conversion_rate": round((purchase_count / checkout_count * 100), 1) if checkout_count > 0 else 0.0,
                "dropoff_rate": round((100 - (purchase_count / checkout_count * 100)), 1) if checkout_count > 0 else 0.0,
            },
        ]

        overall_funnel_cr = round((purchase_count / view_item_count * 100), 2) if view_item_count > 0 else 0.0

        return Response({
            "is_configured": True,
            "property_id": property_id,
            "days": days_int,
            "realtime_active_users": realtime_active_users,
            "total_active_users": total_active_users,
            "total_sessions": total_sessions,
            "total_screen_page_views": total_screen_page_views,
            "bounce_rate": bounce_rate,
            "avg_session_duration": avg_session_duration,
            "views_per_session": views_per_session,
            "channels": channels,
            "devices": devices,
            "top_pages": top_pages,
            "daily_trends": daily_trends,
            "event_counts": event_counts,
            "cities": cities,
            "traffic_sources": traffic_sources,
            "hourly_traffic": hourly_traffic,
            "funnel": {
                "steps": funnel_steps,
                "overall_conversion_rate": overall_funnel_cr,
            },
        }, status=status.HTTP_200_OK)
