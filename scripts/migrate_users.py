import firebase_admin
from firebase_admin import credentials, firestore

print("🔍 Initializing Firebase Admin...")
cred = credentials.Certificate('service-account.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

print("🔍 Looking for 'เทศบาลด่านสำโรง' area...")
areas_ref = db.collection('areas')
areas = areas_ref.stream()

target_area_id = None
target_area_name = None

for area in areas:
    data = area.to_dict()
    if 'ด่านสำโรง' in data.get('name', ''):
        target_area_id = area.id
        target_area_name = data.get('name')
        break

if not target_area_id:
    print("❌ Could not find area matching 'ด่านสำโรง'.")
    exit(1)

print(f"✅ Found target area: {target_area_name} (ID: {target_area_id})")

print("🔍 Fetching users...")
users_ref = db.collection('users')
users = users_ref.stream()

batch = db.batch()
update_count = 0
already_count = 0
admin_count = 0
batch_count = 0

for doc in users:
    data = doc.to_dict()
    
    role = data.get('role')
    if role in ['super_admin', 'local_admin']:
        admin_count += 1
        continue
        
    current_area = data.get('areaId')
    if current_area == target_area_id:
        already_count += 1
        continue
        
    batch.update(doc.reference, {'areaId': target_area_id})
    update_count += 1
    
    if update_count % 450 == 0:
        batch.commit()
        print(f"⏳ Committed batch of 450 updates...")
        batch = db.batch()
        batch_count += 1

if update_count % 450 != 0:
    batch.commit()

print("🎉 Migration complete!")
print(f"📊 Summary:")
print(f"- Users updated: {update_count}")
print(f"- Already in area: {already_count}")
print(f"- Admins skipped: {admin_count}")
