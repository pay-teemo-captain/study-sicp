// SICP JS 5.2
import {
    head,
    list,
    tail,
    pair,
    is_null,
    error,
    map,
    append,
    is_pair,
    apply_in_underlying_javascript,
    for_each,
    is_undefined,
    equal,
    is_string,
    display,
    set_tail
} from 'sicp';


function get_register(machine, reg_name) {
    return machine("get_register")(reg_name);
}

function type(instruction) {
    return head(instruction);
}

function lookup_prim(symbol, operations) {
    const val = assoc(symbol, operations);
    return is_undefined(val)
        ? error(symbol, "unknown operation -- assemble")
        : head(tail(val));
}

function lookup_label(labels, label_name) {
    const val = assoc(label_name, labels);
    return is_undefined(val)
        ? error(label_name, "undefined label -- assemble")
        : tail(val);
}

function make_primitive_exp_ef(exp, machine, labels) {
    if (is_constant_exp(exp)) {
        const c = constant_exp_value(exp);
        return () => c;
    } else if (is_label_exp(exp)) {
        const insts = lookup_label(labels, label_exp_label(exp));
        return () => insts;
    } else if (is_register_exp(exp)) {
        const r = get_register(machine, register_exp_reg(exp));
        return () => get_contents(r);
    } else {
        error(exp, "unknown expression type -- assemble");
    }
}

function make_operation_exp_ef(exp, machine, labels, operations) {
    const op = lookup_prim(operation_exp_op(exp), operations);
    const afuns = map(e => make_primitive_exp_ef(e, machine, labels),
        operation_exp_operands(exp));
    return () => apply_in_underlying_javascript(
        op, map(f => f(), afuns));
}

function assign(register_name, source) {
    return list("assign", register_name, source);
}

function assign_reg_name(assign_instruction) {
    return head(tail(assign_instruction));
}

function assign_value_exp(assign_instruction) {
    return head(tail(tail(assign_instruction)));
}

function make_assign_ef(inst, machine, labels, operations, pc) {
    const target = get_register(machine, assign_reg_name(inst));
    const value_exp = assign_value_exp(inst);
    const value_fun =
        is_operation_exp(value_exp)
            ? make_operation_exp_ef(value_exp, machine, labels, operations)
            : make_primitive_exp_ef(value_exp, machine, labels);
    return () => {
        set_contents(target, value_fun());
        advance_pc(pc);
    };
}

function advance_pc(pc) {
    set_contents(pc, tail(get_contents(pc)));
}

function make_test_ef(inst, machine, labels, operations, flag, pc) {
    const condition = test_condition(inst);
    if (is_operation_exp(condition)) {
        const condition_fun = make_operation_exp_ef(
            condition, machine,
            labels, operations);
        return () => {
            set_contents(flag, condition_fun());
            advance_pc(pc);
        };
    } else {
        error(inst, "bad test instruction -- assemble");
    }
}

function test(condition) {
    return list("test", condition);
}

function test_condition(test_instruction) {
    return head(tail(test_instruction));
}

function make_branch_ef(inst, machine, labels, flag, pc) {
    const dest = branch_dest(inst);
    if (is_label_exp(dest)) {
        const insts = lookup_label(labels, label_exp_label(dest));
        return () => {
            if (get_contents(flag)) {
                set_contents(pc, insts);
            } else {
                advance_pc(pc);
            }
        };
    } else {
        error(inst, "bad branch instruction -- assemble");
    }
}

function branch(label) {
    return list("branch", label);
}

function branch_dest(branch_instruction) {
    return head(tail(branch_instruction));
}

function is_tagged_list(component, the_tag) {
    return is_pair(component) && head(component) === the_tag;
}

function reg(name) {
    return list("reg", name);
}

function is_register_exp(exp) {
    return is_tagged_list(exp, "reg");
}

function register_exp_reg(exp) {
    return head(tail(exp));
}

function constant(value) {
    return list("constant", value);
}

function is_constant_exp(exp) {
    return is_tagged_list(exp, "constant");
}

function constant_exp_value(exp) {
    return head(tail(exp));
}

function label(name) {
    return list("label", name);
}

function is_label_exp(exp) {
    return is_tagged_list(exp, "label");
}

function label_exp_label(exp) {
    return head(tail(exp));
}

function op(name) {
    return list("op", name);
}

function is_operation_exp(exp) {
    return is_pair(exp) && is_tagged_list(head(exp), "op");
}

function operation_exp_op(op_exp) {
    return head(tail(head(op_exp)));
}

function operation_exp_operands(op_exp) {
    return tail(op_exp);
}

function make_go_to_ef(inst, machine, labels, pc) {
    const dest = go_to_dest(inst);
    if (is_label_exp(dest)) {
        const insts = lookup_label(labels, label_exp_label(dest));
        return () => set_contents(pc, insts);
    } else if (is_register_exp(dest)) {
        const reg = get_register(machine, register_exp_reg(dest));
        return () => set_contents(pc, get_contents(reg));
    } else {
        error(inst, "bad go_to instruction -- assemble");
    }
}

function go_to(label) {
    return list("go_to", label);
}

function go_to_dest(go_to_instruction) {
    return head(tail(go_to_instruction));
}

function pop(stack) {
    return stack("pop");
}

function push(stack, value) {
    return stack("push")(value);
}

function make_save_ef(inst, machine, stack, pc) {
    const reg = get_register(machine, stack_inst_reg_name(inst));
    return () => {
        push(stack, get_contents(reg));
        advance_pc(pc);
    };
}

function make_restore_ef(inst, machine, stack, pc) {
    const reg = get_register(machine, stack_inst_reg_name(inst));
    return () => {
        set_contents(reg, pop(stack));
        advance_pc(pc);
    };
}

function save(reg) {
    return list("save", reg);
}

function restore(reg) {
    return list("restore", reg);
}

function stack_inst_reg_name(stack_instruction) {
    return head(tail(stack_instruction));
}

function make_perform_ef(inst, machine, labels, operations, pc) {
    const action = perform_action(inst);
    if (is_operation_exp(action)) {
        const action_fun = make_operation_exp_ef(action, machine,
            labels, operations);
        return () => {
            action_fun();
            advance_pc(pc);
        };
    } else {
        error(inst, "bad perform instruction -- assemble");
    }
}

function perform(action) {
    return list("perform", action);
}

function perform_action(perform_instruction) {
    return head(tail(perform_instruction));
}

function make_execution_function(inst, labels, machine,
                                 pc, flag, stack, ops) {
    return type(inst) === "assign"
        ? make_assign_ef(inst, machine, labels, ops, pc)
        : type(inst) === "test"
            ? make_test_ef(inst, machine, labels, ops, flag, pc)
            : type(inst) === "branch"
                ? make_branch_ef(inst, machine, labels, flag, pc)
                : type(inst) === "go_to"
                    ? make_go_to_ef(inst, machine, labels, pc)
                    : type(inst) === "save"
                        ? make_save_ef(inst, machine, stack, pc)
                        : type(inst) === "restore"
                            ? make_restore_ef(inst, machine, stack, pc)
                            : type(inst) === "push_marker_to_stack"
                                ? make_push_marker_to_stack_ef(machine, stack, pc)
                                : type(inst) === "revert_stack_to_marker"
                                    ? make_revert_stack_to_marker_ef(machine, stack, pc)
                                    : type(inst) === "perform"
                                        ? make_perform_ef(inst, machine, labels, ops, pc)
                                        : error(inst, "unknown instruction type -- assemble");
}

function make_inst(inst_controller_instruction) {
    return pair(inst_controller_instruction, null);
}

function inst_controller_instruction(inst) {
    return head(inst);
}

function inst_execution_fun(inst) {
    return tail(inst);
}

function set_inst_execution_fun(inst, fun) {
    set_tail(inst, fun);
}

function update_insts(insts, labels, machine) {
    const pc = get_register(machine, "pc");
    const flag = get_register(machine, "flag");
    const stack = machine("stack");
    const ops = machine("operations");
    return for_each(inst => set_inst_execution_fun(
            inst,
            make_execution_function(
                inst_controller_instruction(inst),
                labels, machine, pc,
                flag, stack, ops)),
        insts);
}

function make_label_entry(label_name, insts) {
    return pair(label_name, insts);
}

function extract_labels(controller, receive) {
    display("===========")
    display("controller : " + controller);
    display("head of controller : " + head(controller));
    display("tail of controller : " + tail(controller));
    display("receive : " + receive);
    display("===========")


    return is_null(controller)
        ? receive(null, null)
        : extract_labels(
            tail(controller),
            (insts, labels) => {
                const next_element = head(controller);
                return is_string(next_element)
                    ? receive(insts,
                        pair(make_label_entry(next_element,
                                insts),
                            labels))
                    : receive(pair(make_inst(next_element),
                            insts),
                        labels);
            });
}

function assemble(controller, machine) {
    return extract_labels(controller,
        (insts, labels) => {
            update_insts(insts, labels, machine);
            return insts;
        });
}

function make_stack() {
    let stack = null;
    let frame = null;

    function push_marker() {
        frame = pair(stack, frame);
        return "done";
    }

    function pop_marker() {
        stack = head(frame);
        frame = tail(frame);
        return "done";
    }

    function push(x) {
        stack = pair(x, stack);
        return "done";
    }

    function pop() {
        if (is_null(stack)) {
            error("empty stack -- pop");
        } else {
            const top = head(stack);
            stack = tail(stack);
            return top;
        }
    }

    function initialize() {
        stack = null;
        return "done";
    }

    function dispatch(message) {
        return message === "push"
            ? push
            : message === "pop"
                ? pop()
                : message === "push_marker"
                    ? push_marker()
                    : message === "pop_marker"
                        ? pop_marker()
                        : message === "initialize"
                            ? initialize()
                            : error(message, "unknown request -- stack");
    }

    return dispatch;
}

function make_push_marker_to_stack_ef(machine, stack, pc) {
    return () => {
        push_marker(stack);
        advance_pc(pc);
    };
}

function make_revert_stack_to_marker_ef(machine, stack, pc) {
    return () => {
        pop_marker(stack);
        advance_pc(pc);
    };
}

function push_marker_to_stack() {
    return list("push_marker_to_stack");
}

function revert_stack_to_marker() {
    return list("revert_stack_to_marker");
}

function pop_marker(stack) {
    return stack("pop_marker");
}

function push_marker(stack) {
    return stack("push_marker");
}

function make_register(name) {
    let contents = "*unassigned*";

    function dispatch(message) {
        return message === "get"
            ? contents
            : message === "set"
                ? value => {
                    contents = value;
                }
                : error(message, "unknown request -- make_register");
    }

    return dispatch;
}

function lookup(key, table) {
    const record = assoc(key, tail(table));
    return is_undefined(record)
        ? undefined
        : tail(record);
}

function assoc(key, records) {
    return is_null(records)
        ? undefined
        : equal(key, head(head(records)))
            ? head(records)
            : assoc(key, tail(records));
}

function get_contents(register) {
    return register("get");
}

function set_contents(register, value) {
    return register("set")(value);
}

function make_new_machine() {
    const pc = make_register("pc"); // 기계어 명령 실행 순서를 결정
    const flag = make_register("flag"); // 분기 제어
    const stack = make_stack();
    let the_instruction_sequence = null;
    let the_ops = list(list("initialize_stack", () => stack("initialize")));
    let register_table = list(list("pc", pc), list("flag", flag));

    function allocate_register(name) {
        if (is_undefined(assoc(name, register_table))) {
            register_table = pair(list(name, make_register(name)),
                register_table);
        } else {
            error(name, "multiply defined register");
        }
        return "register allocated";
    }

    function lookup_register(name) {
        const val = assoc(name, register_table);
        return is_undefined(val)
            ? error(name, "unknown register")
            : head(tail(val));
    }

    function execute() {
        const insts = get_contents(pc);
        if (is_null(insts)) {
            return "done";
        } else {
            inst_execution_fun(head(insts))();
            return execute();
        }
    }

    function dispatch(message) {
        function start() {
            set_contents(pc, the_instruction_sequence);
            return execute();
        }

        return message === "start"
            ? start()
            : message === "install_instruction_sequence"
                ? seq => {
                    the_instruction_sequence = seq;
                }
                : message === "allocate_register"
                    ? allocate_register
                    : message === "get_register"
                        ? lookup_register
                        : message === "install_operations"
                            ? ops => {
                                the_ops = append(the_ops, ops);
                            }
                            : message === "stack"
                                ? stack
                                : message === "operations"
                                    ? the_ops
                                    : error(message, "unknown request -- machine");
    }

    return dispatch;
}

function make_machine(register_names, ops, controller) {
    const machine = make_new_machine();
    for_each(register_name =>
            machine("allocate_register")(register_name),
        register_names);
    machine("install_operations")(ops);
    machine("install_instruction_sequence")
    (assemble(controller, machine));
    return machine;
}

function start(machine) {
    return machine("start");
}

function get_register_contents(machine, register_name) {
    return get_contents(get_register(machine, register_name));
}

function set_register_contents(machine, register_name, value) {
    set_contents(get_register(machine, register_name), value);
    return "done";
}

const gcd_machine =
    make_machine(
        list("a", "b", "t"),
        list(list("rem", (a, b) => a % b),
            list("=", (a, b) => a === b)),
        list(
            "test_b",
            test(list(op("="), reg("b"), constant(0))),
            branch(label("gcd_done")),
            assign("t", list(op("rem"), reg("a"), reg("b"))),
            assign("a", reg("b")),
            assign("b", reg("t")),
            go_to(label("test_b")),
            "gcd_done"));

set_register_contents(gcd_machine, "a", 206);
set_register_contents(gcd_machine, "b", 40);
start(gcd_machine);

console.log(get_register_contents(gcd_machine, "a"));