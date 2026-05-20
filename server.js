require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors({
    origin: "*"
}));

app.use(express.json());

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

if (!fs.existsSync("uploads")) {

    fs.mkdirSync("uploads");

}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads");

    },

    filename: (req, file, cb) => {

        cb(
            null,
            Date.now() + path.extname(file.originalname)
        );

    }

});

const upload = multer({ storage });

const conexion = mysql.createConnection({

    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT

});

conexion.connect((err) => {

    if (err) {

        console.log("❌ Error de conexión a MySQL");
        console.log(err);

    } else {

        console.log("✅ Conectado a MySQL");

    }

});

app.get("/", (req, res) => {

    res.send("Servidor funcionando 🌱");

});

app.get("/plantas", (req, res) => {

    const sql = `
        SELECT 
            plantas.*,
            categorias.nombre_categoria
        FROM plantas
        INNER JOIN categorias
        ON plantas.categoria_id = categorias.id_categoria
    `;

    conexion.query(sql, (err, resultado) => {

        if (err) {

            res.status(500).json(err);

        } else {

            res.json(resultado);

        }

    });

});

app.post("/login", (req, res) => {

    const { correo, password } = req.body;

    const sql = `
        SELECT * FROM usuarios
        WHERE correo = ?
        AND password = ?
    `;

    conexion.query(
        sql,
        [correo, password],
        (err, resultado) => {

            if (err) {

                res.status(500).json(err);

            } else {

                if (resultado.length > 0) {

                    res.json({
                        mensaje: "✅ Login correcto",
                        usuario: resultado[0]
                    });

                } else {

                    res.status(401).json({
                        mensaje: "❌ Datos incorrectos"
                    });

                }

            }

        }
    );

});

app.post(
    "/agregarPlanta",
    upload.single("imagen"),

    (req, res) => {

        const {
            nombre,
            descripcion,
            precio,
            stock,
            categoria_id
        } = req.body;

        const imagen = req.file
            ? req.file.filename
            : null;

        const sql = `
            INSERT INTO plantas
            (
                nombre,
                descripcion,
                precio,
                stock,
                imagen,
                categoria_id
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        conexion.query(
            sql,
            [
                nombre,
                descripcion,
                precio,
                stock,
                imagen,
                categoria_id
            ],
            (err, resultado) => {

                if (err) {

                    res.status(500).json(err);

                } else {

                    res.json({
                        mensaje: "✅ Planta agregada"
                    });

                }

            }
        );

    }

);

app.put(
    "/editarPlanta/:id",
    upload.single("imagen"),

    (req, res) => {

        const id = req.params.id;

        const {
            nombre,
            descripcion,
            precio,
            stock,
            categoria_id
        } = req.body;

        let sql = `
            UPDATE plantas
            SET
                nombre = ?,
                descripcion = ?,
                precio = ?,
                stock = ?,
                categoria_id = ?
        `;

        let valores = [
            nombre,
            descripcion,
            precio,
            stock,
            categoria_id
        ];

        if (req.file) {

            sql += `, imagen = ?`;

            valores.push(req.file.filename);

        }

        sql += ` WHERE id_planta = ?`;

        valores.push(id);

        conexion.query(
            sql,
            valores,
            (err, resultado) => {

                if (err) {

                    res.status(500).json(err);

                } else {

                    res.json({
                        mensaje: "✅ Planta actualizada"
                    });

                }

            }
        );

    }

);

app.delete("/eliminarPlanta/:id", (req, res) => {

    const id = req.params.id;

    const sql = `
        DELETE FROM plantas
        WHERE id_planta = ?
    `;

    conexion.query(
        sql,
        [id],
        (err, resultado) => {

            if (err) {

                res.status(500).json(err);

            } else {

                res.json({
                    mensaje: "✅ Planta eliminada"
                });

            }

        }
    );

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);

});