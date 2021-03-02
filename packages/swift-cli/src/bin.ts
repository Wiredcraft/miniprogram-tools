#!/usr/bin/env node

import sade from "sade";
import pkg from "../package.json";
import { buildCmd as build } from "./build";

const prog = sade("swift");

prog.version(pkg.version);

const options = [
  ["-l, --level", "Log level (err|info|debug)", "debug"],
  ["-w, --watch", "Watch file change", false],
  ["-o, --output-dir", "The target directory (miniprogram root)", "dist"],
];

const commands = [
  {
    command: "build",
    describe: "build the project",
    examples: ["build -w", "build -l err -w"],
    options,
    action: build,
  },
];

function enableCommand(cmd: any, prog: any) {
  let p = prog.command(cmd.command).describe(cmd.describe);
  const examples = cmd.examples;
  for (let i = 0; i < examples.length; i++) {
    p = p.example(examples[i]);
  }
  const options = cmd.options;
  for (let i = 0; i < options.length; i++) {
    p = p.option(...options[i]);
  }
  p = p.action(cmd.action);
  return p;
}

function enableCommands(cmds: any, prog: any) {
  let p = prog;
  for (let i = 0; i < cmds.length; i++) {
    p = enableCommand(cmds[i], p);
  }
  return p;
}

enableCommands(commands, prog).parse(process.argv);
