/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
//const todo = require("../models/todo");
let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo test suite ", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test("Create new todo", async () => {
    const resu = await agent.get("/");
    const csrfTok = extractCsrfToken(resu);
    const response = await agent.post("/todos").send({
      title: "Go to movie",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfTok,
    });
    expect(response.statusCode).toBe(302); //http status code
  });

  test("Mark todo as completed (Updating Todo)", async () => {
    let resu = await agent.get("/");
    let csrfTok = extractCsrfToken(resu);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfTok,
    });
    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsGrupRes = JSON.parse(gropuedTodosResponse.text);
    const dueTodCout = parsGrupRes.dueToday.length;
    const latestTodo = parsGrupRes.dueToday[dueTodCout - 1];
    const status = latestTodo.completed ? false : true;
    resu = await agent.get("/");
    csrfTok = extractCsrfToken(resu);

    const response = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: status,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test(" Delete todo using ID", async () => {
    let resu = await agent.get("/");
    let csrfTok = extractCsrfToken(resu);
    await agent.post("/todos").send({
      title: "Go to shopping",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfTok,
    });

    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsGrupRes = JSON.parse(gropuedTodosResponse.text);
    const dueTodCout = parsGrupRes.dueToday.length;
    const latestTodo = parsGrupRes.dueToday[dueTodCout - 1];

    resu = await agent.get("/");
    csrfTok = extractCsrfToken(resu);

    const response = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfTok,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });
});
