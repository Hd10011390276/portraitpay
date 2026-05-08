with open('src/lib/auth/schemas.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix UserRole enum
c = c.replace('  USER: "USER",', '  ACTOR: "ACTOR",')
c = c.replace('  ARTIST: "ARTIST",', '  CREATOR: "CREATOR",')
c = c.replace('  ENTERPRISE: "ENTERPRISE",', '  LAWYER: "LAWYER",')

# Fix role enum in RegisterSchema
c = c.replace(
    'role: z.enum(["user", "artist", "agency", "enterprise"],',
    'role: z.enum(["actor", "creator", "agency", "lawyer"],'
)

with open('src/lib/auth/schemas.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('schemas.ts done')

# Fix translations.ts en-US role labels
with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Find en-US block and fix within it
en_start = c.index('"en-US":')
en_end = en_start + 60000
en_block = c[en_start:en_end]

en_block = en_block.replace(
    'roleUser: "Regular User",\n      roleUserDesc: "Browse and purchase digital artwork",',
    'roleActor: "Actor",\n      roleActorDesc: "For actors and performers managing AI consent",'
)
en_block = en_block.replace(
    'roleArtist: "Artist",\n      roleArtistDesc: "Upload and sell personal artwork",',
    'roleCreator: "Creator",\n      roleCreatorDesc: "For digital artists and content creators",'
)
en_block = en_block.replace(
    'roleAgency: "Agency",\n      roleAgencyDesc: "Manage artists and works under the agency",',
    'roleAgency: "Agency",\n      roleAgencyDesc: "Manage talent accounts and licensing deals",'
)
en_block = en_block.replace(
    'roleEnterprise: "Enterprise",\n      roleEnterpriseDesc: "Bulk procurement and enterprise cooperation",',
    'roleLawyer: "Lawyer",\n      roleLawyerDesc: "Entertainment and IP lawyers for contract review",'
)

c = c[:en_start] + en_block + c[en_end:]

with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('translations.ts done')

# Fix RoleSelector.tsx
with open('src/components/auth/RoleSelector.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('value: "USER"', 'value: "ACTOR"')
c = c.replace('value: "ARTIST"', 'value: "CREATOR"')
c = c.replace('value: "ENTERPRISE"', 'value: "LAWYER"')
c = c.replace("label: t.register.roleUser,\n      description: t.register.roleUserDesc,", "label: t.register.roleActor,\n      description: t.register.roleActorDesc,")
c = c.replace("label: t.register.roleArtist,\n      description: t.register.roleArtistDesc,", "label: t.register.roleCreator,\n      description: t.register.roleCreatorDesc,")
c = c.replace("label: t.register.roleEnterprise,\n      description: t.register.roleEnterpriseDesc,", "label: t.register.roleLawyer,\n      description: t.register.roleLawyerDesc,")
c = c.replace("description: t.register.roleAgencyDesc,\n      icon: \"🏢\",", "description: t.register.roleAgencyDesc,\n      icon: \"🏢\",")
c = c.replace("icon: \"🏭\",", "icon: \"⚖️\",")

with open('src/components/auth/RoleSelector.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('RoleSelector.tsx done')
print('All done!')
