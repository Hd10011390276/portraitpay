"""
Add Spanish portraits and kyc to es-ES section.
Uses line-based insertion at the es-ES footer closing.
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The es-ES footer }, is at index 4429, // Agency page at 4430
# We insert Spanish content AFTER }, and BEFORE // Agency page
closing = lines[4429].strip()
agency = lines[4430]
print(f"Index 4429: {repr(lines[4429])}")
print(f"Index 4430: {repr(lines[4430])}")
assert closing == '},', "Expected }, at 4429, got: " + repr(closing)
assert 'Agency page' in agency, "Expected Agency page at 4430"

es_portraits_kyc = """
    // Portraits
    portraits: {
      title: "Mis Retratos",
      subtitle: "Gestiona tu galeria de retratos",
      upload: "Subir Retrato",
      noPortraits: "Sin retratos aun, por favor sube",
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
    // KYC
    kyc: {
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
"""

# Build new content:
# lines[:4430] = indices 0-4429 = everything up to and including }
# Then Spanish content (no need to append }, again since it's already included)
# Then lines[4431:] = from enterpriseAgency onwards (skipping // Agency page)
new_lines = lines[:4430]  # indices 0-4429
new_lines.append(es_portraits_kyc)
new_lines.extend(lines[4431:])  # skip // Agency page line

print(f"Original lines: {len(lines)}, New lines: {len(new_lines)}")

with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Done!")

# Verify
with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    verify = f.read()

has_mis_retratos = '"Mis Retratos"' in verify
has_es_back = '"back": "Volver"' in verify
has_es_kyc = '"Verificacion de Identidad"' in verify

print(f"\nVerification:")
print(f"  es-ES has 'Mis Retratos': {has_mis_retratos}")
print(f"  es-ES has Spanish 'back': {has_es_back}")
print(f"  es-ES has Spanish kyc: {has_es_kyc}")