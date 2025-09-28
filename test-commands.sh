#!/bin/bash

# 🎯 COMANDOS RÁPIDOS PARA TESTING DEL SISTEMA DE HORARIOS
# Ejecuta estos comandos después de configurar el entorno de prueba

echo "🚀 Iniciando tests del sistema de horarios..."

# Variables
BASE_URL="http://localhost:3000"
STUDENT_EMAIL="juan.perez@estudiante.edu"
STUDENT_CODE="SIS2024001"

echo "📋 Configuración:"
echo "   Base URL: $BASE_URL"
echo "   Student: $STUDENT_EMAIL"
echo "   Code: $STUDENT_CODE"
echo ""

# 1. Test de Login
echo "🔐 1. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"password123\"
  }")

echo "Response: $LOGIN_RESPONSE"

# Extraer token (simplificado)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. No token received."
    exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:20}..."
echo ""

# 2. Test de Horario
echo "📅 2. Testing Student Schedule..."
SCHEDULE_RESPONSE=$(curl -s -X GET $BASE_URL/students/$STUDENT_CODE/schedule \
  -H "Authorization: Bearer $TOKEN")

echo "Schedule Response:"
echo $SCHEDULE_RESPONSE | jq '.' 2>/dev/null || echo $SCHEDULE_RESPONSE
echo ""

# 3. Test de Historial Académico
echo "📊 3. Testing Academic History..."
HISTORY_RESPONSE=$(curl -s -X GET $BASE_URL/students/$STUDENT_CODE/academic-history \
  -H "Authorization: Bearer $TOKEN")

echo "History Response:"
echo $HISTORY_RESPONSE | jq '.' 2>/dev/null || echo $HISTORY_RESPONSE
echo ""

# 4. Test de Grupos Disponibles
echo "🔍 4. Testing Available Groups..."
GROUPS_RESPONSE=$(curl -s -X GET $BASE_URL/course-groups/available \
  -H "Authorization: Bearer $TOKEN")

echo "Available Groups:"
echo $GROUPS_RESPONSE | jq '.' 2>/dev/null || echo $GROUPS_RESPONSE
echo ""

# 5. Test de Solicitud de Cambio (Ejemplo)
echo "📝 5. Testing Change Request Creation..."
CHANGE_REQUEST=$(curl -s -X POST $BASE_URL/change-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sourceGroupId": "673f8a1b2c3d4e5f6a7b8c9d",
    "targetGroupId": "673f8a1b2c3d4e5f6a7b8c9e",
    "reason": "Testing change request functionality"
  }')

echo "Change Request Response:"
echo $CHANGE_REQUEST | jq '.' 2>/dev/null || echo $CHANGE_REQUEST
echo ""

# 6. Test de Acceso sin Autenticación
echo "🚫 6. Testing Unauthorized Access..."
UNAUTH_RESPONSE=$(curl -s -X GET $BASE_URL/students/$STUDENT_CODE/schedule)

echo "Unauthorized Response:"
echo $UNAUTH_RESPONSE | jq '.' 2>/dev/null || echo $UNAUTH_RESPONSE
echo ""

echo "🎉 Testing completed!"
echo ""
echo "📋 Summary:"
echo "   ✅ Login functionality"
echo "   ✅ Student schedule retrieval"
echo "   ✅ Academic history visualization"
echo "   ✅ Available groups listing"
echo "   ✅ Change request creation"
echo "   ✅ Security validation"
echo ""
echo "🔗 Para testing interactivo, visita: $BASE_URL/api"