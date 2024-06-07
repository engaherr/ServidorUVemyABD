const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const sql = require('./config/database');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json');

dotenv.config();

var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var corsOptions = {
    origin: ["http://localhost:3001", "http://localhost:8080"],
    methods: "GET,PUT,POST,DELETE",
};

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(cors(corsOptions));
app.use("/api/comentarios", require('./routes/comentarios.routes'));
app.use("/api/cursos", require('./routes/cursos.routes'));
app.use("/api/cursoslistas", require('./routes/cursoslistas.routes'));
app.use("/api/clases", require('./routes/clases.routes'));
app.use("/api/documentos", require('./routes/documentos.routes'));
app.use("/api/tiposarchivos", require('./routes/tiposarchivos.routes'));
app.use("/api/autenticacion", require('./routes/autenticacion.routes'));
app.use("/api/perfil", require('./routes/perfil.routes'));
app.use("/api/cursosetiquetas", require('./routes/cursosetiquetas.routes'));
app.use("/api/usuarioscursos", require('./routes/usuarioscursos.routes'));
app.use("/api/etiquetas", require('./routes/etiquetas.routes'));
app.use("/api/usuarios", require('./routes/usuarios.routes'));

const errorLogger = require('./middlewares/errorlogger.middleware');
const errorHandler = require('./middlewares/errorhandler.middleware');
app.use(errorLogger, errorHandler);

app.get('*', (req, res) => { res.status(404).send(); });


sql.connectToDB();

app.listen(process.env.SERVER_PORT, () => {
    console.log('Aplicacion de ejemplo escuchando en el puerto ' + process.env.SERVER_PORT);
});

// gRPC

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const PROTO_PATH = "./proto/documento.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const documentoProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

const { enviarVideoClase, recibirVideoClase, actualizarVideoClase } = require('./services/videogrpc.service');

server.addService(documentoProto.VideoService.service,
    {
        EnviarVideoClase: enviarVideoClase,
        RecibirVideoClase: recibirVideoClase,
        ActualizarVideoClase: actualizarVideoClase
    });

server.bindAsync(`${process.env.SERVER_HOST_GRPC}:${process.env.SERVER_PORT_GRPC}`, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`Servidor gRPC en ejecución en el puerto ${process.env.SERVER_PORT_GRPC}`);
});

module.exports = app;
