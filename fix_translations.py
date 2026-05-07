"""
Fix translations.ts:
1. Remove duplicate 'detail: {' at line 3678 in en-US portraits.detail
2. Remove duplicate 'kyc: {' at line 3717 in en-US kyc
3. Restore English text in en-US portraits.detail and kyc (was corrupted to Spanish)
4. Add proper Spanish portraits.detail and kyc to es-ES section
"""
with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# ============================================================
# STEP 1: Fix en-US portraits.detail (lines 3676-3712)
# Remove duplicate 'detail: {' line and fix Spanish -> English
# ============================================================

# The English portraits.detail block (proper English, no duplicate)
en_portraits_detail = """      // Portrait detail page
      detail: {
        back: "Back",
        details: "Details",
        description: "Description",
        category: "Category",
        visibility: "Visibility",
        public: "Public",
        private: "Private",
        created: "Created",
        owner: "Owner",
        imageHash: "Image Hash (SHA-256)",
        notCertified: "Not Yet Certified",
        notCertifiedDesc: "Certify this portrait on Sepolia to create an immutable proof of authorship.",
        certifyOnBlockchain: "Certify on Blockchain",
        certifying: "Certifying...",
        imageHashNotAvailable: "Portrait image hash not available",
        edit: "Edit",
        archive: "Archive",
        archiving: "Archiving...",
        blockchainCertificate: "Blockchain Certificate",
        downloadCertificate: "Download Blockchain Certificate",
        network: "Network",
        txHash: "Tx Hash",
        ipfsCid: "On-Chain Hash",
        certifiedAt: "Certified At",
        certifyConfirm: "Certify this portrait on Sepolia? This will create an on-chain transaction.",
        certifyStepHash: "Calculating image hash...",
        certifyStepUploadMeta: "Saving metadata...",
        certifyStepMint: "Minting on Sepolia (confirm wallet)...",
        certifyStepConfirm: "Waiting for block confirmation...",
        certifySuccess: "Certified! Block #",
        certifyFailed: "Error: ",
        certifyNetworkError: "Network error. Please try again.",
        archiveConfirm: "Archive this portrait? It will be hidden but not permanently deleted.",
        download: "Download",
        localStorage: "Local Storage",
        portraitNotFound: "Local portrait not found",
        savedToDownloads: "Photo saved to downloads folder",
        downloadFailed: "Download failed, please try again",
        bannerKycRequired: "You have not completed identity verification. On-chain functions are limited.",
        bannerGoVerify: "Verify Now",
      },
    },
    // KYC"""

# The English kyc block (proper English, no duplicate)
en_kyc = """    kyc: {
      title: "Identity Verification",
      subtitle: "Complete identity verification to unlock all features",
      pending: "Verification Pending",
      approved: "Verified",
      rejected: "Verification Rejected",
      uploadId: "Upload ID",
      verify: "Start Verification",
      step1Title: "Basic Information",
      step2Title: "Upload Document",
      step3Title: "Face Verification",
      step4Title: "Completed",
      supportedDocs: "Make sure the photo is clear and legible",
      frontSide: "ID Front",
      backSide: "ID Back",
      backSideOptional: "ID Back (Optional)",
      submitDoc: "Submit Documents",
      submitting: "Submitting...",
      verificationPending: "Verification Pending",
      verificationApproved: "Verification Approved",
      verificationRejected: "Verification Rejected",
      verificationRejectedDesc: "Your verification was rejected. Please resubmit.",
      faceVerifyTitle: "Face Verification",
      faceVerifyDesc: "We will compare your portrait with your ID photo.",
      takePhoto: "Take Photo",
      uploadPhoto: "Upload Photo",
      retake: "Retake",
      confirmPhoto: "Confirm Photo",
      faceVerifyConfirm: "Confirm and Submit",
      verificationSuccess: "Verification Successful!",
      verificationSuccessDesc: "Your identity has been verified. You now have full access.",
      backToDashboard: "Back to Dashboard",
      docType: "Document Type",
      docTypeIdCard: "ID Card",
      docTypePassport: "Passport",
      docTypeDriverLicense: "Driver License",
      country: "Country",
      countryPlaceholder: "Select country",
      idNumber: "ID Number",
      idNumberPlaceholder: "Enter ID number",
      idNumberHint: "Your information is encrypted and never shared.",
      selfieHint: "Take a clear selfie holding your ID document",
      continue: "Continue",
      verifyError: "Verification failed. Please try again.",
      networkError: "Network error. Please check your connection.",
      uploadProgress: "Uploading...",
      verifyProgress: "Verifying...",
      alreadyVerified: "Already Verified",
      alreadyVerifiedDesc: "Your identity has been verified.",
      statusApproved: "Approved",
      statusRejected: "Rejected",
      statusPending: "Pending",
      statusExpired: "Expired",
      warningNoKyc: "You have not completed identity verification and cannot perform blockchain certification.",
      goToKyc: "Verify Now",
      clickToUpload: "Click or drag to upload",
      maxFileSize: "Max 10MB, supports JPG/PNG",
    },
    withdraw: {"""

# Spanish portraits.detail block
es_portraits_detail = """    portraits: {
      title: "Mis Retratos",
      subtitle: "Gestiona tu galería de retratos",
      upload: "Subir Retrato",
      noPortraits: "Sin retratos aún, por favor sube",
      uploadNew: "Subir Nuevo Retrato",
      all: "Todos",
      draft: "Borrador",
      underReview: "En Revision",
      active: "Activo",
      suspended: "Suspendido",
      archived: "Archivado",
      total: "Total",
      onChain: "En Cadena",
      noResults: "No se encontraron resultados",
      tryDifferentKeyword: "Prueba con una palabra diferente",
      uploadFirstPortrait: "Sube tu primer retrato",
      searchPlaceholder: "Buscar retratos...",
      // Portrait detail page
      detail: {
        back: "Volver",
        details: "Detalles",
        description: "Descripcion",
        category: "Categoria",
        visibility: "Visibilidad",
        public: "Publico",
        private: "Privado",
        created: "Creado",
        owner: "Propietario",
        imageHash: "Hash de Imagen (SHA-256)",
        notCertified: "Aun No Certificado",
        notCertifiedDesc: "Certifica este retrato en Sepolia para crear una prueba inmutable de autoria.",
        certifyOnBlockchain: "Certificar en Blockchain",
        certifying: "Certificando...",
        imageHashNotAvailable: "Hash de imagen de retrato no disponible",
        edit: "Editar",
        archive: "Archivar",
        archiving: "Archivando...",
        blockchainCertificate: "Certificado de Blockchain",
        downloadCertificate: "Descargar Certificado de Blockchain",
        network: "Red",
        txHash: "Hash de Tx",
        ipfsCid: "Hash en Cadena",
        certifiedAt: "Certificado En",
        certifyConfirm: "Certificar este retrato en Sepolia? Esto creara una transaccion en cadena.",
        certifyStepHash: "Calculando hash de imagen...",
        certifyStepUploadMeta: "Guardando metadatos...",
        certifyStepMint: "Mintando en Sepolia (confirmando billetera)...",
        certifyStepConfirm: "Esperando confirmacion de bloque...",
        certifySuccess: "Certificado! Bloque #",
        certifyFailed: "Error: ",
        certifyNetworkError: "Error de red. Intenta de nuevo.",
        archiveConfirm: "Archivar este retrato? Estara oculto pero no eliminado permanentemente.",
        download: "Descargar",
        localStorage: "Almacenamiento Local",
        portraitNotFound: "Retrato local no encontrado",
        savedToDownloads: "Foto guardada en carpeta de descargas",
        downloadFailed: "Descarga fallida, por favor intenta de nuevo",
        bannerKycRequired: "No has completado la verificacion de identidad. Las funciones en cadena son limitadas.",
        bannerGoVerify: "Verificar Ahora",
      },
    },
    // KYC"""

# Spanish kyc block
es_kyc = """    kyc: {
      title: "Verificacion de Identidad",
      subtitle: "Completa la verificacion de identidad para desbloquear todas las funciones",
      pending: "Verificacion Pendiente",
      approved: "Verificado",
      rejected: "Verificacion Rechazada",
      uploadId: "Subir ID",
      verify: "Iniciar Verificacion",
      step1Title: "Informacion Basica",
      step2Title: "Subir Documento",
      step3Title: "Verificacion Facial",
      step4Title: "Completado",
      supportedDocs: "Asegurate de que la foto sea clara y legible",
      frontSide: "Frente de ID",
      backSide: "Reverso de ID",
      backSideOptional: "Reverso de ID (Opcional)",
      submitDoc: "Enviar Documentos",
      submitting: "Enviando...",
      verificationPending: "Verificacion Pendiente",
      verificationApproved: "Verificacion Aprobada",
      verificationRejected: "Verificacion Rechazada",
      verificationRejectedDesc: "Tu verificacion fue rechazada. Por favor reenvia.",
      faceVerifyTitle: "Verificacion Facial",
      faceVerifyDesc: "Compararemos tu retrato con la foto de tu documento de identidad.",
      takePhoto: "Tomar Foto",
      uploadPhoto: "Subir Foto",
      retake: "Volver a Tomar",
      confirmPhoto: "Confirmar Foto",
      faceVerifyConfirm: "Confirmar y Enviar",
      verificationSuccess: "Verificacion Exitosa!",
      verificationSuccessDesc: "Tu identidad ha sido verificada. Ahora tienes acceso completo.",
      backToDashboard: "Volver al Panel",
      docType: "Tipo de Documento",
      docTypeIdCard: "Tarjeta de Identidad",
      docTypePassport: "Pasaporte",
      docTypeDriverLicense: "Licencia de Conducir",
      country: "Pais",
      countryPlaceholder: "Seleccionar pais",
      idNumber: "Numero de ID",
      idNumberPlaceholder: "Ingresa el numero de ID",
      idNumberHint: "Tu informacion esta encriptada y nunca se comparte.",
      selfieHint: "Toma un selfie claro sosteniendo tu documento de identidad",
      continue: "Continuar",
      verifyError: "Verificacion fallida. Por favor intenta de nuevo.",
      networkError: "Error de red. Por favor verifica tu conexion.",
      uploadProgress: "Subiendo...",
      verifyProgress: "Verificando...",
      alreadyVerified: "Ya Verificado",
      alreadyVerifiedDesc: "Tu identidad ha sido verificada.",
      statusApproved: "Aprobado",
      statusRejected: "Rechazado",
      statusPending: "Pendiente",
      statusExpired: "Expirado",
      warningNoKyc: "No has completado la verificacion de identidad y no puedes realizar la certificacion en blockchain.",
      goToKyc: "Verificar Ahora",
      clickToUpload: "Haz clic o arrastra para subir",
      maxFileSize: "Max 10MB, soporta JPG/PNG",
    },
    withdraw: {"""

# ============================================================
# STEP 1: Fix en-US portraits.detail
# Find and replace the corrupted block (lines ~3676-3715)
# ============================================================

# Find the en-US portraits.detail start: "// Portrait detail page" after line 3657
en_portraits_start = None
en_portraits_end = None
for i, line in enumerate(lines):
    if i >= 3655 and line.strip() == "// Portrait detail page":
        en_portraits_start = i
    if en_portraits_start is not None and en_portraits_end is None:
        # Look for the end: "bannerGoVerify: ..." followed by "    },"
        if "bannerGoVerify:" in line:
            # Next substantial line after this should be the closing },
            for j in range(i+1, min(i+5, len(lines))):
                if lines[j].strip() == "},":
                    en_portraits_end = j
                    break
            break

print(f"en-US portraits.detail: lines {en_portraits_start+1}-{en_portraits_end+1}")

# Find the en-US kyc start
en_kyc_start = None
en_kyc_end = None
for i, line in enumerate(lines):
    if i >= 3710 and line.strip().startswith("// KYC"):
        en_kyc_start = i
    if en_kyc_start is not None and en_kyc_end is None:
        if line.strip() == "}," and i > en_kyc_start:
            en_kyc_end = i
            break

print(f"en-US kyc: lines {en_kyc_start+1}-{en_kyc_end+1}")

# ============================================================
# STEP 2: Find es-ES section location for portraits and kyc
# ============================================================
es_start = None
es_portraits_insert = None  # where to insert portraits block in es-ES
es_kyc_insert = None  # where to insert kyc block in es-ES
for i, line in enumerate(lines):
    if '"es-ES":' in line:
        es_start = i
    # In es-ES, find where portraits: { would go (after nav, common, hero sections)
    # We want to insert after the portraits: section closes in es-ES
    # Actually, we need to find the existing portraits closing brace in es-ES
    # and the existing kyc closing brace

print(f"es-ES section starts at line {es_start+1}")

# ============================================================
# REBUILD the file
# ============================================================
result = []
i = 0
while i < len(lines):
    # Replace en-US portraits.detail block
    if i == en_portraits_start:
        result.append(en_portraits_detail)
        i = en_portraits_end + 1
    # Replace en-US kyc block
    elif i == en_kyc_start:
        result.append(en_kyc)
        i = en_kyc_end + 1
    else:
        result.append(lines[i])
        i += 1

# Now result has fixed en-US sections
# We need to add Spanish portraits.detail and kyc to es-ES

# Convert back to string to do es-ES insertion
new_content = '\n'.join(result)
lines = new_content.split('\n')

# Find es-ES section
es_start = None
es_portraits_pos = None  # position AFTER es-ES portraits: {  ...  }, to insert detail
es_kyc_pos = None  # position AFTER es-ES kyc: { ... }, to insert after kyc
es_portraits_closing = None
es_kyc_closing = None

for i, line in enumerate(lines):
    if '"es-ES":' in line:
        es_start = i
    # Find es-ES portraits: { ... }, closing
    # Look for the closing of portraits in es-ES (after es_start)
    if es_start and i > es_start and 'portraits: {' in line:
        # Find the closing brace for this portraits block
        depth = 0
        for j in range(i, min(i+50, len(lines))):
            if '{' in lines[j]:
                depth += lines[j].count('{')
            if '}' in lines[j]:
                depth -= lines[j].count('}')
            if depth == 0 and j > i:
                es_portraits_closing = j
                break
    # Find es-ES kyc: { ... }, closing
    if es_start and i > es_start and 'kyc: {' in line and '//' not in line.split('kyc')[0]:
        depth = 0
        for j in range(i, min(i+80, len(lines))):
            if '{' in lines[j]:
                depth += lines[j].count('{')
            if '}' in lines[j]:
                depth -= lines[j].count('}')
            if depth == 0 and j > i:
                es_kyc_closing = j
                break

print(f"es-ES portraits closing: {es_portraits_closing+1 if es_portraits_closing else None}")
print(f"es-ES kyc closing: {es_kyc_closing+1 if es_kyc_closing else None}")

# Actually, let me re-read the es-ES section to understand structure
# The es-ES has a portraits: { title, subtitle, ... } block
# and we need to add detail: {} to it
# and the kyc section exists too but may be missing keys

# Let me check what keys es-ES portraits has vs what's missing
# From reading earlier, es-ES section starts at 4309
# The portraits section in es-ES has title/subtitle but NO detail block
# The kyc section in es-ES might also be missing keys

# Since finding exact positions is fragile, let me use a different approach:
# Use string replacement on the full content

# But first, let me verify the approach by checking es-ES portraits content
print(f"\nLines around es-ES portraits:")
for i in range(4309, 4330):
    if i < len(lines):
        print(f"  {i+1}: {lines[i][:80]}")

print(f"\nLines around es-ES portraits closing search:")
if es_portraits_closing:
    for i in range(es_portraits_closing-2, es_portraits_closing+3):
        if 0 <= i < len(lines):
            print(f"  {i+1}: {lines[i][:80]}")
else:
    print("  portraits closing not found!")

print(f"\nLines around es-ES kyc closing search:")
if es_kyc_closing:
    for i in range(es_kyc_closing-2, es_kyc_closing+3):
        if 0 <= i < len(lines):
            print(f"  {i+1}: {lines[i][:80]}")
else:
    print("  kyc closing not found!")

# Let me use content-based replacement instead
# Find the es-ES portraits closing pattern
# The pattern is: "    },  // KYC" or similar after portraits content

# For es-ES, find where the portraits section ends (before // KYC comment)
es_pattern_portraits_end = '      // Portrait detail page'
es_pattern_kyc_start = '    // KYC'

# But first, let me just write the file and do the es-ES fix separately
with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"\nStep 1 done: Fixed en-US sections. File has {len(lines)} lines")