const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const s3 = new S3Client({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLES = {
  students: process.env.STUDENTS_TABLE,
  parents: process.env.PARENTS_TABLE,
  links: process.env.STUDENT_PARENT_LINKS_TABLE,
  enrollments: process.env.ENROLLMENTS_TABLE,
  classGroups: process.env.CLASS_GROUPS_TABLE,
  classYears: process.env.CLASS_YEARS_TABLE,
  classArms: process.env.CLASS_ARMS_TABLE,
  sessions: process.env.SESSIONS_TABLE,
  terms: process.env.TERMS_TABLE,
  auditEvents: process.env.AUDIT_EVENTS_TABLE
};

const normalizeEmail = (value) => (value ? value.trim().toLowerCase() : '');

const normalizeKey = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizeName = (value) => value.trim().toLowerCase();
const normalizePhone = (value) => {
  const trimmed = value ? value.toString().trim() : '';
  if (!trimmed) return '';
  const sciMatch = trimmed.match(/^[0-9.]+e[+-]?\d+$/i);
  const base = sciMatch ? Math.round(Number(trimmed)).toString() : trimmed;
  const digits = base.replace(/\D/g, '');
  if (!digits) return '';
  return `+${digits}`;
};

const parseCsvRows = (text) => {
  const rows = [];
  let current = [];
  let cell = '';
  let inQuotes = false;
  const normalized = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      current.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      current.push(cell);
      if (current.some((value) => value.trim().length > 0)) {
        rows.push(current);
      }
      current = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell.length || current.length) {
    current.push(cell);
    if (current.some((value) => value.trim().length > 0)) {
      rows.push(current);
    }
  }
  return rows;
};

const headerAliases = {
  admissionNo: ['admissionno', 'admissionnumber', 'admission'],
  firstName: ['firstname', 'first'],
  lastName: ['lastname', 'surname', 'last'],
  parentPhone: ['parentphone', 'phone', 'guardianphone', 'primaryphone'],
  parentEmail: ['parentemail', 'email', 'guardianemail'],
  parentName: ['parentname', 'guardianname'],
  classGroup: ['classgroup', 'class', 'classgroupname'],
  classYear: ['classyear', 'year', 'grade'],
  classArm: ['classarm', 'arm', 'stream'],
  term: ['term', 'semester'],
  session: ['session', 'academicsession'],
  classGroupId: ['classgroupid'],
  classYearId: ['classyearid'],
  classArmId: ['classarmid'],
  termId: ['termid'],
  sessionId: ['sessionid']
};

const canonicalHeaders = Object.keys(headerAliases);

const parseCsv = (body) => {
  const rows = parseCsvRows(body);
  if (rows.length < 2) return [];
  const rawHeaders = rows[0].map((header) => header.trim());
  const normalizedHeaders = new Map(rawHeaders.map((header) => [normalizeKey(header), header]));
  const headerMap = {};
  canonicalHeaders.forEach((key) => {
    const candidates = [normalizeKey(key), ...(headerAliases[key] || [])];
    const match = candidates.map((candidate) => normalizedHeaders.get(candidate)).find(Boolean);
    if (match) headerMap[key] = match;
  });
  return rows.slice(1).map((cols) => {
    const item = {};
    canonicalHeaders.forEach((key) => {
      const header = headerMap[key];
      if (!header) {
        item[key] = '';
        return;
      }
      const index = rawHeaders.indexOf(header);
      item[key] = index >= 0 ? (cols[index] || '').trim() : '';
    });
    return item;
  });
};

const streamToString = async (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });

const queryAll = async (params) => {
  const items = [];
  let lastKey;
  do {
    const res = await dynamo.send(
      new QueryCommand({
        ...params,
        ExclusiveStartKey: lastKey
      })
    );
    items.push(...(res.Items || []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
};

const referenceCache = new Map();

const loadReferenceData = async (schoolId) => {
  if (referenceCache.has(schoolId)) return referenceCache.get(schoolId);
  const classGroups = TABLES.classGroups
    ? await queryAll({
        TableName: TABLES.classGroups,
        IndexName: 'bySchoolClassGroup',
        KeyConditionExpression: 'schoolId = :sid',
        ExpressionAttributeValues: {
          ':sid': schoolId
        }
      })
    : [];
  const classYears = TABLES.classYears
    ? await queryAll({
        TableName: TABLES.classYears,
        IndexName: 'bySchoolClassYear',
        KeyConditionExpression: 'schoolId = :sid',
        ExpressionAttributeValues: {
          ':sid': schoolId
        }
      })
    : [];
  const classArms = TABLES.classArms
    ? await queryAll({
        TableName: TABLES.classArms,
        IndexName: 'bySchoolArm',
        KeyConditionExpression: 'schoolId = :sid',
        ExpressionAttributeValues: {
          ':sid': schoolId
        }
      })
    : [];
  const sessions = TABLES.sessions
    ? await queryAll({
        TableName: TABLES.sessions,
        IndexName: 'bySchoolSession',
        KeyConditionExpression: 'schoolId = :sid',
        ExpressionAttributeValues: {
          ':sid': schoolId
        }
      })
    : [];
  const terms = [];
  if (TABLES.terms) {
    for (const session of sessions) {
      const sessionTerms = await queryAll({
        TableName: TABLES.terms,
        IndexName: 'bySession',
        KeyConditionExpression: 'sessionId = :sid',
        ExpressionAttributeValues: {
          ':sid': session.id
        }
      });
      terms.push(...sessionTerms);
    }
  }

  const toNameMap = (items, key) =>
    items.reduce((acc, item) => {
      const nameKey = normalizeName(item[key] || '');
      if (!nameKey) return acc;
      if (!acc[nameKey]) acc[nameKey] = [];
      acc[nameKey].push(item);
      return acc;
    }, {});

  const data = {
    classGroups,
    classYears,
    classArms,
    sessions,
    terms,
    classGroupByName: toNameMap(classGroups, 'displayName'),
    classGroupById: new Map(classGroups.map((group) => [group.id, group])),
    classYearByName: toNameMap(classYears, 'name'),
    classArmByName: toNameMap(classArms, 'name'),
    sessionByName: toNameMap(sessions, 'name'),
    termByName: toNameMap(terms, 'name')
  };
  referenceCache.set(schoolId, data);
  return data;
};

const resolveSingleMatch = (items, label, rawValue, errors) => {
  if (!rawValue) return null;
  if (!items || items.length === 0) {
    errors.push(`Unknown ${label}: ${rawValue}`);
    return null;
  }
  if (items.length > 1) {
    errors.push(`Ambiguous ${label}: ${rawValue}`);
    return null;
  }
  return items[0];
};

const putItem = (TableName, Item) =>
  dynamo
    .send(
      new PutCommand({
        TableName,
        Item,
        ConditionExpression: 'attribute_not_exists(id)'
      })
    )
    .catch((err) => {
      if (err.name === 'ConditionalCheckFailedException') return;
      throw err;
    });

const findStudentByAdmission = async (schoolId, admissionNo) => {
  if (!TABLES.students || !admissionNo) return null;
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.students,
      IndexName: 'bySchoolStudents',
      KeyConditionExpression: 'schoolId = :sid and admissionNo = :adm',
      ExpressionAttributeValues: {
        ':sid': schoolId,
        ':adm': admissionNo
      }
    })
  );
  return (res.Items || [])[0] || null;
};

const findParentByPhone = async (schoolId, phone) => {
  if (!TABLES.parents || !phone) return null;
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.parents,
      IndexName: 'bySchoolParents',
      KeyConditionExpression: 'schoolId = :sid and primaryPhone = :ph',
      ExpressionAttributeValues: {
        ':sid': schoolId,
        ':ph': phone
      }
    })
  );
  return (res.Items || [])[0] || null;
};

const findParentByEmail = async (schoolId, email) => {
  if (!TABLES.parents || !email) return null;
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.parents,
      IndexName: 'bySchoolParentEmail',
      KeyConditionExpression: 'schoolId = :sid and #email = :em',
      ExpressionAttributeNames: {
        '#email': 'email'
      },
      ExpressionAttributeValues: {
        ':sid': schoolId,
        ':em': email
      }
    })
  );
  return (res.Items || [])[0] || null;
};

const updateItem = async (TableName, Key, updates) => {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (!entries.length) return false;
  const names = {};
  const values = {};
  const sets = entries.map(([key, value], idx) => {
    const nameKey = `#k${idx}`;
    const valueKey = `:v${idx}`;
    names[nameKey] = key;
    values[valueKey] = value;
    return `${nameKey} = ${valueKey}`;
  });
  await dynamo.send(
    new UpdateCommand({
      TableName,
      Key,
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values
    })
  );
  return true;
};

const writeAuditEvent = async ({ schoolId, action, entityType, entityId, afterJson }) => {
  if (!TABLES.auditEvents || !schoolId || !entityId) return;
  await dynamo.send(
    new PutCommand({
      TableName: TABLES.auditEvents,
      Item: {
        schoolId,
        id: randomUUID(),
        actorUserId: null,
        action,
        entityType,
        entityId,
        afterJson: afterJson ? JSON.stringify(afterJson) : null,
        createdAt: new Date().toISOString()
      }
    })
  );
};

const upsertEnrollment = async (schoolId, studentId, termId, classGroupId, sessionId) => {
  if (!TABLES.enrollments) return;
  if (termId) {
    const existing = await dynamo.send(
      new QueryCommand({
        TableName: TABLES.enrollments,
        IndexName: 'byStudentEnrollment',
        KeyConditionExpression: 'studentId = :sid and termId = :tid',
        ExpressionAttributeValues: {
          ':sid': studentId,
          ':tid': termId
        }
      })
    );
    if ((existing.Items || []).length) {
      const current = existing.Items[0];
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLES.enrollments,
          Key: { schoolId, id: current.id },
          UpdateExpression: 'SET classGroupId = :cg, sessionId = :sess, #status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':cg': classGroupId,
            ':sess': sessionId || current.sessionId || 'TBD',
            ':status': 'ENROLLED'
          }
        })
      );
      return;
    }
  }
  const enrollmentId = randomUUID();
  await putItem(TABLES.enrollments, {
    schoolId,
    id: enrollmentId,
    studentId,
    classGroupId,
    termId: termId || 'TBD',
    sessionId: sessionId || 'TBD',
    status: 'ENROLLED'
  });
};

/**
 * Placeholder import worker.
 * Expected payloads for CSV import jobs (import.requested).
 */
const parsePayload = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    return JSON.parse(raw);
  }
  return raw;
};

const getRecords = (event) => {
  if (Array.isArray(event?.Records)) {
    return event.Records.map((record) => ({
      id: record.messageId,
      body: record.body
    }));
  }
  if (event?.detail) {
    return [
      {
        id: event.id || 'eventbridge',
        body: event.detail
      }
    ];
  }
  return [];
};

exports.handler = async (event) => {
  console.log('Import worker received', JSON.stringify(event));
  const records = getRecords(event);
  for (const record of records) {
    try {
      const payload = parsePayload(record.body);
      if (!payload) {
        console.warn('Skipping empty payload', record.id);
        continue;
      }
      console.log('Processing record', record.id, 'payload', payload);
      if (payload.bucket && payload.key && process.env.UPLOADS_BUCKET) {
        const obj = await s3.send(
          new GetObjectCommand({ Bucket: payload.bucket, Key: payload.key })
        );
        const body = obj.Body ? await streamToString(obj.Body) : '';
        const rows = parseCsv(body);
        console.log(`Loaded ${rows.length} data rows from ${payload.key}`);

        const referenceData = await loadReferenceData(payload.schoolId);
        const summary = { processed: rows.length, created: 0, updated: 0, skipped: 0, errors: 0 };
        const errors = [];
        const seenAdmission = new Set();
        const dedupedParentsByPhone = new Map();
        const dedupedParentsByEmail = new Map();
        for (const [index, row] of rows.entries()) {
          const rowNumber = index + 2;
          const admissionNo = row.admissionNo || row.admission;
          const parentPhoneRaw = row.parentPhone;
          const parentPhone = normalizePhone(parentPhoneRaw);
          const rowErrors = [];
          if (!admissionNo || !row.firstName || !row.lastName || !parentPhone) {
            rowErrors.push('Missing required fields');
          }

          let classGroupId = row.classGroupId;
          if (!classGroupId && row.classGroup) {
            const matches = referenceData.classGroupByName[normalizeName(row.classGroup)] || [];
            const resolved = resolveSingleMatch(matches, 'class group', row.classGroup, rowErrors);
            if (resolved) classGroupId = resolved.id;
          }
          let classYearId = row.classYearId;
          if (!classYearId && row.classYear) {
            const matches = referenceData.classYearByName[normalizeName(row.classYear)] || [];
            const resolved = resolveSingleMatch(matches, 'class year', row.classYear, rowErrors);
            if (resolved) classYearId = resolved.id;
          }
          let classArmId = row.classArmId;
          if (!classArmId && row.classArm) {
            const matches = referenceData.classArmByName[normalizeName(row.classArm)] || [];
            const resolved = resolveSingleMatch(matches, 'class arm', row.classArm, rowErrors);
            if (resolved) classArmId = resolved.id;
          }

          if (!classGroupId) {
            if (classYearId && classArmId) {
              const matches = referenceData.classGroups.filter(
                (group) => group.classYearId === classYearId && group.classArmId === classArmId
              );
              const resolved = resolveSingleMatch(matches, 'class group for class year/arm', `${row.classYear}/${row.classArm}`, rowErrors);
              if (resolved) classGroupId = resolved.id;
            } else if (classYearId && !classArmId) {
              const matches = referenceData.classGroups.filter(
                (group) => group.classYearId === classYearId && !group.classArmId
              );
              const resolved = resolveSingleMatch(matches, 'class group for class year', row.classYear || classYearId, rowErrors);
              if (resolved) classGroupId = resolved.id;
            }
          }

          if (classGroupId) {
            const group = referenceData.classGroupById.get(classGroupId);
            if (!group) {
              rowErrors.push('Invalid classGroupId');
            } else {
              if (classYearId && group.classYearId && classYearId !== group.classYearId) {
                rowErrors.push('classYear does not match classGroup');
              }
              if (classArmId && group.classArmId && classArmId !== group.classArmId) {
                rowErrors.push('classArm does not match classGroup');
              }
            }
          }

          if (!classGroupId) {
            rowErrors.push('Missing class group (provide classGroup or classYear + classArm)');
          }

          let sessionId = row.sessionId;
          if (!sessionId && row.session) {
            const matches = referenceData.sessionByName[normalizeName(row.session)] || [];
            const resolved = resolveSingleMatch(matches, 'session', row.session, rowErrors);
            if (resolved) sessionId = resolved.id;
          }
          let termId = row.termId;
          if (!termId && row.term) {
            if (sessionId) {
              const matches = referenceData.terms.filter(
                (term) => term.sessionId === sessionId && normalizeName(term.name) === normalizeName(row.term)
              );
              const resolved = resolveSingleMatch(matches, 'term', row.term, rowErrors);
              if (resolved) termId = resolved.id;
            } else {
              const matches = referenceData.termByName[normalizeName(row.term)] || [];
              const resolved = resolveSingleMatch(matches, 'term (add session to disambiguate)', row.term, rowErrors);
              if (resolved) termId = resolved.id;
            }
          }

          if (rowErrors.length) {
            errors.push({ rowNumber, row, reason: rowErrors.join('; ') });
            summary.errors++;
            continue;
          }
          if (admissionNo && seenAdmission.has(admissionNo)) {
            console.warn('Duplicate admission detected; skipping', admissionNo);
            errors.push({ rowNumber, row, reason: 'Duplicate admission in file' });
            summary.errors++;
            continue;
          }
          if (admissionNo) seenAdmission.add(admissionNo);
          // Enforce one active enrollment per student per term: let latest write win; existing item will be overwritten on same id
          const existingStudent = await findStudentByAdmission(payload.schoolId, admissionNo);
          const studentId = existingStudent?.id || randomUUID();
          const parentEmail = normalizeEmail(row.parentEmail || row.email || row.parentEmailAddress);
          let parentId = dedupedParentsByPhone.get(parentPhone);
          if (!parentId && parentEmail) {
            parentId = dedupedParentsByEmail.get(parentEmail);
          }
          let existingParent = null;
          if (!parentId) {
            existingParent = await findParentByPhone(payload.schoolId, parentPhone);
            if (!existingParent && parentEmail) {
              existingParent = await findParentByEmail(payload.schoolId, parentEmail);
            }
            parentId = existingParent?.id || randomUUID();
            dedupedParentsByPhone.set(parentPhone, parentId);
            if (parentEmail) {
              dedupedParentsByEmail.set(parentEmail, parentId);
            }
            if (TABLES.parents && parentPhone && !existingParent) {
              await putItem(TABLES.parents, {
                schoolId: payload.schoolId,
                id: parentId,
                fullName: row.parentName || 'Parent',
                primaryPhone: parentPhone,
                email: parentEmail || null,
                status: 'ACTIVE'
              });
            }
          }
          if (TABLES.students) {
            let rowCreated = false;
            let rowUpdated = false;
            if (!existingStudent) {
              await putItem(TABLES.students, {
                schoolId: payload.schoolId,
                id: studentId,
                admissionNo: admissionNo || studentId,
                firstName: row.firstName || '',
                lastName: row.lastName || '',
                status: 'ACTIVE'
              });
              summary.created++;
              rowCreated = true;
            } else {
              const studentUpdates = {};
              if (row.firstName && row.firstName !== existingStudent.firstName) {
                studentUpdates.firstName = row.firstName;
              }
              if (row.lastName && row.lastName !== existingStudent.lastName) {
                studentUpdates.lastName = row.lastName;
              }
              if (!existingStudent.status) {
                studentUpdates.status = 'ACTIVE';
              }
              const updatedStudent = await updateItem(
                TABLES.students,
                { schoolId: payload.schoolId, id: studentId },
                studentUpdates
              );
              rowUpdated = rowUpdated || updatedStudent;
            }
            if (TABLES.parents && existingParent) {
              const parentUpdates = {};
              if (row.parentName && row.parentName !== existingParent.fullName) {
                parentUpdates.fullName = row.parentName;
              }
              if (parentEmail && parentEmail !== existingParent.email) {
                parentUpdates.email = parentEmail;
              }
              const updatedParent = await updateItem(
                TABLES.parents,
                { schoolId: payload.schoolId, id: parentId },
                parentUpdates
              );
              rowUpdated = rowUpdated || updatedParent;
            }
            if (!rowCreated && rowUpdated) {
              summary.updated++;
            } else if (!rowCreated && !rowUpdated) {
              summary.skipped++;
            }
          }

          if (TABLES.links) {
            await putItem(TABLES.links, {
              schoolId: payload.schoolId,
              id: randomUUID(),
              studentId,
              parentId,
              relationship: 'GUARDIAN',
              isPrimary: true
            });
          }

          if (TABLES.enrollments && classGroupId) {
            await upsertEnrollment(
              payload.schoolId,
              studentId,
              termId,
              classGroupId,
              sessionId
            );
          }
        }
        // Example: update a status record if provided
        if (payload.schoolId && payload.statusTable && payload.statusId) {
          const errorCount = errors.length;
          let errorReportKey;
          if (errorCount && process.env.UPLOADS_BUCKET) {
            const csv = ['rowNumber,reason,row'].concat(
              errors.map((e) => {
                return `"${e.rowNumber || ''}","${e.reason.replace(/"/g, '""')}","${JSON.stringify(e.row).replace(
                  /"/g,
                  '""'
                )}"`;
              })
            ).join('\n');
            errorReportKey =
              payload.errorReportKey ||
              `${payload.key}.errors.${Date.now()}.csv`;
            await s3.send(
              new PutObjectCommand({
                Bucket: payload.bucket,
                Key: errorReportKey,
                Body: csv,
                ContentType: 'text/csv'
              })
            );
          }
          const statusValue = summary.errors > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
          await dynamo.send(
            new UpdateCommand({
              TableName: payload.statusTable,
              Key: { schoolId: payload.schoolId, id: payload.statusId },
              UpdateExpression:
                'SET #status = :status, processedLines = :cnt, processedAt = :now, created = :created, updated = :updated, errors = :errors, skipped = :skipped, errorReportKey = :errKey',
              ExpressionAttributeNames: {
                '#status': 'status'
              },
              ExpressionAttributeValues: {
                ':status': statusValue,
                ':cnt': rows.length,
                ':now': new Date().toISOString(),
                ':created': summary.created,
                ':updated': summary.updated,
                ':errors': summary.errors,
                ':skipped': summary.skipped,
                ':errKey': errorReportKey || null
              }
            })
          );
          await writeAuditEvent({
            schoolId: payload.schoolId,
            action: 'IMPORT_COMPLETED',
            entityType: 'ImportJob',
            entityId: payload.statusId,
            afterJson: {
              processed: rows.length,
              created: summary.created,
              updated: summary.updated,
              skipped: summary.skipped,
              errors: summary.errors,
              errorReportKey: errorReportKey || null
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed processing record', record.messageId, err);
      throw err;
    }
  }
  return {};
};
