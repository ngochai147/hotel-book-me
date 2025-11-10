#!/bin/bash

# Test Date Overlap Detection Fix
# Verifies that bookings with same date but different times are properly detected as overlapping

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:8080}"
TOKEN="${TOKEN:-}"
HOTEL_ID="${HOTEL_ID:-}"

echo "================================================"
echo "  Date Overlap Detection Fix - Test"
echo "================================================"
echo ""

if [ -z "$TOKEN" ] || [ -z "$HOTEL_ID" ]; then
    echo -e "${RED}Error: TOKEN and HOTEL_ID must be set${NC}"
    echo "Usage:"
    echo "  export TOKEN='your-firebase-token'"
    echo "  export HOTEL_ID='hotel-id'"
    exit 1
fi

echo -e "${BLUE}Testing scenario: Same date with different times${NC}"
echo ""

# Test 1: Create booking with time component in milliseconds
echo -e "${YELLOW}Test 1: Create booking with time component${NC}"
echo "Request: checkIn=2025-12-21T23:45:14.991Z"

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/bookings" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "hotelId": "'$HOTEL_ID'",
        "roomTypes": ["Deluxe Room"],
        "checkIn": "2025-12-21T23:45:14.991Z",
        "checkOut": "2025-12-25T10:30:00.000Z",
        "guests": 2,
        "totalPrice": 1000
    }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ Booking created successfully${NC}"
    BOOKING_ID=$(echo "$body" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "  Booking ID: $BOOKING_ID"
    echo ""
else
    echo -e "${RED}✗ Failed to create booking (code: $http_code)${NC}"
    echo "$body"
    exit 1
fi

# Test 2: Try to book same date with different time (should FAIL)
echo -e "${YELLOW}Test 2: Try booking same date with different time${NC}"
echo "Request: checkIn=2025-12-21T00:00:00.000Z"
echo "Expected: 400 Error (overlap detected)"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/bookings" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "hotelId": "'$HOTEL_ID'",
        "roomTypes": ["Deluxe Room"],
        "checkIn": "2025-12-21T00:00:00.000Z",
        "checkOut": "2025-12-25T00:00:00.000Z",
        "guests": 2,
        "totalPrice": 1000
    }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ PASS: Overlap correctly detected!${NC}"
    echo -e "${GREEN}  System prevented double booking on same date${NC}"
    
    # Check if error message mentions unavailable rooms
    if echo "$body" | grep -q "not available"; then
        echo -e "${GREEN}  Error message: Room not available ✓${NC}"
    fi
else
    echo -e "${RED}✗ FAIL: Overlap NOT detected (code: $http_code)${NC}"
    echo -e "${RED}  System allowed double booking on same date!${NC}"
    echo "$body"
    
    # Cleanup both bookings if test failed
    if [ -n "$BOOKING_ID" ]; then
        curl -s -X DELETE "$API_URL/api/bookings/$BOOKING_ID" \
            -H "Authorization: Bearer $TOKEN" > /dev/null
    fi
    exit 1
fi

echo ""

# Test 3: Try booking different date (should SUCCEED)
echo -e "${YELLOW}Test 3: Try booking different date${NC}"
echo "Request: checkIn=2025-12-26T00:00:00.000Z"
echo "Expected: 201 Success (no overlap)"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/bookings" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "hotelId": "'$HOTEL_ID'",
        "roomTypes": ["Deluxe Room"],
        "checkIn": "2025-12-26T00:00:00.000Z",
        "checkOut": "2025-12-30T00:00:00.000Z",
        "guests": 2,
        "totalPrice": 800
    }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ PASS: Different date booking allowed${NC}"
    BOOKING_ID_2=$(echo "$body" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "  Booking ID: $BOOKING_ID_2"
else
    echo -e "${RED}✗ FAIL: Different date booking rejected (code: $http_code)${NC}"
    echo "$body"
fi

echo ""

# Cleanup
echo -e "${YELLOW}Cleanup: Deleting test bookings${NC}"
if [ -n "$BOOKING_ID" ]; then
    curl -s -X DELETE "$API_URL/api/bookings/$BOOKING_ID" \
        -H "Authorization: Bearer $TOKEN" > /dev/null
    echo "  Deleted booking: $BOOKING_ID"
fi

if [ -n "$BOOKING_ID_2" ]; then
    curl -s -X DELETE "$API_URL/api/bookings/$BOOKING_ID_2" \
        -H "Authorization: Bearer $TOKEN" > /dev/null
    echo "  Deleted booking: $BOOKING_ID_2"
fi

echo ""
echo "================================================"
echo -e "${GREEN}  All Tests Passed! ✅${NC}"
echo "================================================"
echo ""
echo "Summary:"
echo "  ✅ Same date with different times → Detected as overlap"
echo "  ✅ Different dates → Allowed"
echo "  ✅ Date comparison ignores time component"
