import shapefile
import json
import os
import math

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Raio da Terra em km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def interpolate_points(points, start_km, end_km, step_km=0.2):
    """
    Interpola pontos ao longo de uma lista de coordenadas (lon, lat)
    a cada step_km (padrao 200 metros).
    """
    if not points or len(points) < 2:
        return []
    
    # Calcular distancias acumuladas entre os pontos originais
    segment_distances = []
    total_dist = 0
    for i in range(len(points) - 1):
        d = haversine_distance(points[i][1], points[i][0], points[i+1][1], points[i+1][0])
        segment_distances.append(d)
        total_dist += d
        
    if total_dist == 0:
        return []

    interpolated = []
    current_dist_km = 0
    next_target_km = math.ceil(start_km / step_km) * step_km
    
    # Adicionar o primeiro ponto
    interpolated.append({"km": round(start_km, 3), "lat": points[0][1], "lng": points[0][0]})
    
    # Percorrer segmentos e interpolar
    accumulated_dist = 0
    for i in range(len(points) - 1):
        p1 = points[i]
        p2 = points[i+1]
        seg_dist = segment_distances[i]
        
        while accumulated_dist + seg_dist >= (next_target_km - start_km) and next_target_km <= end_km:
            # Fração do segmento onde o ponto alvo está
            target_within_seg = (next_target_km - start_km) - accumulated_dist
            fraction = target_within_seg / seg_dist if seg_dist > 0 else 0
            
            # Interpolação linear de coordenadas (aproximação)
            interp_lat = p1[1] + (p2[1] - p1[1]) * fraction
            interp_lng = p1[0] + (p2[0] - p1[0]) * fraction
            
            interpolated.append({
                "km": round(next_target_km, 3),
                "lat": interp_lat,
                "lng": interp_lng
            })
            next_target_km += step_km
            
        accumulated_dist += seg_dist
        
    return interpolated

shp_path = r'C:\Users\Nei\Desktop\PMRV-main\Rodovias_SC_04.24\Rodovias_SC.shp'
output_path = r'C:\Users\Nei\Desktop\PMRV-main\js\gps_data_sc.js'

rodovias_dict = {}

try:
    with shapefile.Reader(shp_path) as sf:
        # Indices dos campos (considerando o DeletionFlag que o pyshp pula no record())
        # Campos: ['RODOVIA', 'INICIO TRE', 'FINAL TREC', 'KM INICIAL', 'KM FINAL', 'EXTENSAO', 'SITUAÇÃO', 'REVESTIMEN']
        # No pyshp record(), os campos comecam do 0
        for i, shape_rec in enumerate(sf.shapeRecords()):
            rec = shape_rec.record
            name = str(rec[0]).strip()
            km_ini = float(rec[3])
            km_fim = float(rec[4])
            points = shape_rec.shape.points # Lista de (lon, lat)
            
            if not name or len(points) < 2:
                continue
                
            # Interpola pontos a cada 200m
            interp = interpolate_points(points, km_ini, km_fim, 0.2)
            
            if name not in rodovias_dict:
                rodovias_dict[name] = []
            
            rodovias_dict[name].extend(interp)

    # Limpeza: Ordenar por KM e remover duplicados se houver trechos sobrepostos
    for name in rodovias_dict:
        rodovias_dict[name] = sorted(rodovias_dict[name], key=lambda x: x['km'])

    # Gerar arquivo JS
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("/* Dados de Rodovias de SC - Interpolados a cada 200m */\n")
        f.write("window.GPS_RODOVIAS_SC = ")
        json.dump(rodovias_dict, f, indent=2, ensure_ascii=False)
        f.write(";\n")
        
    print(f"Sucesso! Gerado {output_path} com {len(rodovias_dict)} rodovias.")

except Exception as e:
    import traceback
    print(f"Erro no processamento: {e}")
    traceback.print_exc()
