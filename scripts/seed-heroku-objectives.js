'use strict';
const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');

// Get the DATABASE_URL from environment or use the provided one
const databaseUrl = process.env.DATABASE_URL || process.argv[2];

if (!databaseUrl) {
  console.error('Please provide a DATABASE_URL as an environment variable or command line argument');
  process.exit(1);
}

// Initialize Sequelize with Heroku's database URL
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
});

// Embed the objectives data directly in the script
const objectivesData = [
  {
    "name": "Venta total",
    "description": "La suma de las ventas de todos los productos y servicios de UYTECH: o Equipamiento (hardware, networking, insumos, etc.) o Licenciamiento (MS365, VDC, etc.) o Contratos nuevos y ampliaciones de contratos de soporte o Pool de horas de servicio prepagas o Horas de servicio en implementaciones, cableados y otros.",
    "type": "Currency",
    "target_2025": 2000000.0,
    "weight": 0.3,
    "per_salesperson": {
      "Carolina Rivero": 500000.0,
      "Guido Cabrera": 400000.0,
      "SHIRLEY Roche": 100000.0,
      "Federico Mendez": 700000.0,
      "Manuel Tato": 300000.0
    }
  },
  {
    "name": "Venta de Proyectos",
    "description": "Venta de Proyectos: Cableado estructurado, Wifi, CCTV, Control de acceso, etc.",
    "type": "Currency",
    "target_2025": 200000.0,
    "weight": 0.1,
    "per_salesperson": {
      "Carolina Rivero": 100000.0,
      "SHIRLEY Roche": 100000.0
    }
  },
  {
    "name": "Nuevos contratos de servicio.",
    "description": "Venta de contratos de servicios anuales a nuebos clientes o existentes. Minimo de 6 hrs. mensuales.",
    "type": "Number",
    "target_2025": 5.0,
    "weight": 0.2,
    "per_salesperson": {
      "Carolina Rivero": 3.0,
      "Guido Cabrera": 2.0
    }
  },
  {
    "name": "Venta de horas de servicio",
    "description": "Venta de horas de servicio en contratos anuales. Suma los nuevos contratos o las ampliaciones. Se evaluará en función de los contratos de diciembre.  No cuentan los pool de horas.",
    "type": "Number",
    "target_2025": 50.0,
    "weight": 0.1,
    "per_salesperson": {
      "Carolina Rivero": 30.0,
      "Guido Cabrera": 20.0
    }
  },
  {
    "name": "Oportunidades de mejora ",
    "description": "Evaluación de oportunidades de mejora realizadas  a los clientes.  Pueden ser en profundidad junto al cliente, o solo con el equipo de servicio (comercial+servicios).  ",
    "type": "Number",
    "target_2025": 44.0,
    "weight": 0.2,
    "per_salesperson": {
      "Carolina Rivero": 20.0,
      "Guido Cabrera": 20.0
    }
  },
  {
    "name": "Evaluación de ciberseguridad",
    "description": "Evaluaciones de ciberseguridad realizadas a clientes con contrato.  Pueden ser en profundidad junto al cliente, o solo con el equipo de servicio (comercial+servicios).  Se calcula en % de clientes asignados al ejecutivo.",
    "type": "Number",
    "target_2025": 0.0,
    "weight": 0.1,
    "per_salesperson": {
      "Carolina Rivero": 0.0,
      "Guido Cabrera": 0.0
    }
  },
  {
    "name": "Prospeción de clientes",
    "description": "Prospects contactados y realizada la reunión de presentación de UYTECH.",
    "type": "Number",
    "target_2025": 15.0,
    "weight": 1.0000000000000002,
    "per_salesperson": {
      "SHIRLEY Roche": 15.0
    }
  },
  {
    "name": "Satisfacicón de clientes",
    "description": "Bono final es bono * Satisfacción de clientes de servicio.",
    "type": "Percentage",
    "target_2025": 0.9,
    "weight": 0.1,
    "per_salesperson": {
      "Carolina Rivero": 0.9,
      "Guido Cabrera": 0.9,
      "SHIRLEY Roche": 0.9,
      "Federico Mendez": 0.9
    }
  }
];

// Current date for created/updated timestamps
const now = new Date();

// Start and end dates for 2025 objectives
const startDate = new Date('2025-01-01');
const endDate = new Date('2025-12-31');

async function seed() {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log('Connected to the database');

    // Check if we already have quantitative objectives
    const [results] = await sequelize.query('SELECT COUNT(*) FROM "QuantitativeObjective"');
    const count = parseInt(results[0].count, 10);
    
    if (count > 0) {
      console.log(`Found ${count} existing quantitative objectives. Clearing them first...`);
      await sequelize.query('DELETE FROM "SalespersonQuantitativeObjective"');
      await sequelize.query('DELETE FROM "QuantitativeObjective"');
      console.log('Cleared existing quantitative objectives');
    }

    // Prepare objectives data
    const objectives = objectivesData
      .filter(obj => obj.name) // Filter out entries without name
      .map(obj => {
        // Convert type string to lowercase to match the enum
        let dbType;
        if (obj.type === 'Currency') {
          dbType = 'currency';
        } else if (obj.type === 'Percentage') {
          dbType = 'percentage';
        } else if (obj.type === 'Number') {
          dbType = 'number';
        } else {
          // Default to number if no valid type
          dbType = 'number';
        }

        return {
          id: uuidv4(),
          name: obj.name,
          description: obj.description,
          type: dbType,
          companyTarget: obj.target_2025 || 0,
          minimumAcceptable: obj.target_2025 * 0.7, // 70% of target as minimum
          weight: obj.weight || 0,
          startDate,
          endDate,
          status: 'pending',
          isGlobal: true, // All company objectives are global
          createdAt: now,
          updatedAt: now
        };
      });

    // Insert objectives
    console.log(`Inserting ${objectives.length} quantitative objectives`);
    
    // Build VALUES clause for SQL INSERT
    const values = objectives.map(obj => `(
      '${obj.id}', 
      '${obj.name.replace(/'/g, "''")}', 
      '${obj.description ? obj.description.replace(/'/g, "''") : ""}', 
      '${obj.type}', 
      ${obj.companyTarget}, 
      ${obj.minimumAcceptable}, 
      ${obj.weight}, 
      '${obj.startDate.toISOString()}', 
      '${obj.endDate.toISOString()}', 
      '${obj.status}', 
      ${obj.isGlobal}, 
      '${obj.createdAt.toISOString()}', 
      '${obj.updatedAt.toISOString()}'
    )`).join(',');
    
    // Execute the INSERT
    await sequelize.query(`
      INSERT INTO "QuantitativeObjective" (
        "id", "name", "description", "type", "companyTarget", 
        "minimumAcceptable", "weight", "startDate", "endDate", 
        "status", "isGlobal", "createdAt", "updatedAt"
      ) VALUES ${values}
    `);
    
    console.log('Objectives inserted successfully');

    // Now get all salespersons to assign objectives
    const [salespersons] = await sequelize.query('SELECT id, nombre FROM "Salesperson"');
    
    // Create a mapping of salesperson names to IDs
    const salespersonMap = {};
    salespersons.forEach(sp => {
      // Convert to lowercase to make matching case-insensitive
      salespersonMap[sp.nombre.toLowerCase()] = sp.id;
      
      // Add variations of names
      if (sp.nombre === 'Juan Manuel Tato') {
        salespersonMap['manuel tato'] = sp.id;
      }
      
      if (sp.nombre === 'Shirley Roche') {
        salespersonMap['shirley roche'] = sp.id;
      }

      if (sp.nombre === 'Federico Mendez') {
        salespersonMap['federico mendez'] = sp.id;
      }
    });
    
    // Get all the objectives we just inserted
    const [insertedObjectives] = await sequelize.query('SELECT id, name FROM "QuantitativeObjective"');
    
    // Create a mapping of objective names to IDs
    const objectiveMap = {};
    insertedObjectives.forEach(obj => {
      objectiveMap[obj.name] = obj.id;
    });
    
    // Prepare assignments
    const assignments = [];
    
    objectivesData.filter(obj => obj.name).forEach(obj => {
      const objectiveId = objectiveMap[obj.name];
      if (!objectiveId) {
        console.log(`Objective not found: ${obj.name}`);
        return;
      }
      
      // Process per_salesperson assignments
      Object.entries(obj.per_salesperson || {}).forEach(([salespersonName, target]) => {
        // Try to find the salesperson by name (case-insensitive)
        const salespersonId = salespersonMap[salespersonName.toLowerCase()];
        if (!salespersonId) {
          console.log(`Salesperson not found: ${salespersonName}`);
          return; // Skip this assignment
        }
        
        assignments.push({
          id: uuidv4(),
          salespersonId,
          quantitativeObjectiveId: objectiveId,
          individualTarget: target,
          monthlyProgress: '{}', // Empty JSON object as string
          currentValue: 0,
          status: 'pending',
          createdAt: now,
          updatedAt: now
        });
      });
    });
    
    if (assignments.length === 0) {
      console.log('No valid assignments found');
    } else {
      console.log(`Inserting ${assignments.length} salesperson-objective assignments`);
      
      // Build VALUES clause for assignments
      const assignmentValues = assignments.map(asg => `(
        '${asg.id}', 
        '${asg.salespersonId}', 
        '${asg.quantitativeObjectiveId}', 
        ${asg.individualTarget}, 
        '${asg.monthlyProgress}', 
        ${asg.currentValue}, 
        '${asg.status}', 
        '${asg.createdAt.toISOString()}', 
        '${asg.updatedAt.toISOString()}'
      )`).join(',');
      
      // Execute the INSERT for assignments
      await sequelize.query(`
        INSERT INTO "SalespersonQuantitativeObjective" (
          "id", "salespersonId", "quantitativeObjectiveId", "individualTarget",
          "monthlyProgress", "currentValue", "status", "createdAt", "updatedAt"
        ) VALUES ${assignmentValues}
      `);
      
      console.log('Assignments inserted successfully');
    }
    
    console.log('Seeding completed successfully');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

seed(); 