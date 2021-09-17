/*-------------------- 
    GAME BOARD JS
--------------------*/
class GameBoard {
    state = ['', '', '', '', '', '', '', '', '']
    size = 3
    championFlow = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ]

    constructor (state = null) {
        if (state != null) this.state = state
    }

    showGameBoard () {
        let result = ''
        let size = this.size
        for (let i = 0; i < this.state.length; i++)
        {
            let item = this.state[i]
            if (item == '')
            {
                result += '   '
            } else {
                result += ' ' + item + ' '
            }

            if (i % size < 2) result += '|'

            if ((i+1) % size == 0 && i < this.state.length-1) result += '\n-----------\n'
        }
    }

    click (player, index) {
        if (player != 'x' && player != 'o')  player = ''
        this.state[index] = player
    }

    getPossibleClick() {
        let count = 0
        this.state.forEach(el  => { if (el == '') count++ })
        return count
    }

    getChampions() {
        let win, tmpPlayer
        for (let i = 0; i < this.championFlow.length; i++)
        {
            win = true
            tmpPlayer = null
            for (let j = 0; j < this.championFlow[i].length; j++)
            {
                let item = this.championFlow[i][j]
                if ( (tmpPlayer != null && tmpPlayer != this.state[item]) || this.state[item] == '' )
                {
                    win = false
                    break
                }
                tmpPlayer = this.state[item]
            }
            if (win) return tmpPlayer
        }
        return (this.getPossibleClick() == 0) ? 'draw' : null
    }
}

/*-------------------- 
       ROBOT JS 
--------------------*/

class Robot {
    board = null
    player = null
    clicks  = []
    maxDepth = 100

    constructor(player, board) {
        this.player = player
        this.board  = board
    }

    minimax(board, isMaximizing, depth) {
        let scores = { win: 1, lose: -1, draw: 0 }

        let win = board.getChampions()
        if (win != null) {
            if (win == 'draw') return scores.draw
            return (this.player == win) ? scores.win : scores.lose
        }

        if (depth == this.maxDepth) return scores.draw

        if (isMaximizing) {
            let bestScore = -Infinity
            for (let i = 0; i < board.state.length; i++) {
                if (board.state[i] == '') {
                    let newBoard = new GameBoard([...board.state])
                    newBoard.click(this.player, i)
                    let score = this.minimax(newBoard, false, depth + 1)
                    bestScore = Math.max(score, bestScore)
                    this.clicks.push({ depth, isMaximizing, click: i, score })
                }
            }
            return bestScore
        
        } else {
            let bestScore = Infinity
            for (let i = 0; i < board.state.length; i++) {
                if (board.state[i] == '') {
                    let newBoard = new GameBoard([...board.state])
                    let enemy = (this.player == 'x') ? 'o' : 'x'
                    newBoard.click(enemy, i) 
                    let score = this.minimax(newBoard, true, depth + 1)
                    this.clicks.push({ depth, isMaximizing, click: i, score })
                    bestScore = Math.min(score, bestScore)
                }
            }
            return bestScore
        }
    }

    getBestClick() {
        let minimax = this.minimax(this.board, true, 0)
        let bestScore       = -Infinity
        let filter_depth_0  = this.clicks.filter((el) => {
            if (el.depth == 0) bestScore = Math.max(el.score, bestScore)
            return el.depth === 0
        })
        let filter_best_click= filter_depth_0.filter((el) => el.score >= bestScore)
        
        let bestClick = filter_best_click[Math.floor(Math.random() * filter_best_click.length)]
        bestClick.instance = this

        return bestClick
    }
}


/*-------------------- 
    PLAYING JS 
--------------------*/

let board = new GameBoard()
let turn = 'x'
let players = { x: 'human', o: 'human' }
let BotConfig = { x: { maxDepth: 10 }, o: { maxDepth: 10 } }
let state = null
let turnHistory = []

document.addEventListener("DOMContentLoaded", () => $('table').css('display', 'none'))

function main() {
    if ($('#btn').html() == 'Refresh') {
        turn = 'x'
        board = new GameBoard()
        turnHistory = []
        state = null
        $('#result').html('')
        $('table').css('display', 'none')
        $('#btn').html('Play Game')
        return
    }

    if(checkplayer()){
        $('table').css('display', 'table')
        $('#btn').html('Refresh')
        nextClick()
    }
}

function checkplayer(){
    if($('#playerX').val() == 0){
        alert('Please Select Player X');
        return false;
    }

    if($('#playerO').val() == 0){
        alert('Please Select Player O');
        return false;
    }

    return true;
}

$('#btn').on('click', () => main())
$('#playerX').on('change', () => players.x = $('#playerX').val() )
$('#playerO').on('change', () => players.o = $('#playerO').val() )

function nextClick() {
    board.showGameBoard()
    renderGameBoard()

    let win = board.getChampions()
    if (win != null) {
        if (win == 'draw') { 
            let msg = 'Game Draw!'
            state = 'draw';
            $('#result').html(msg);
        } else {
            let msg = 'Player ' + win.toUpperCase() + ' Champions!!!'
            state = 'win'
            $('#result').html(msg)
        }
    } else {
        let gameText = "Player " + turn.toUpperCase() +" turn..."
        $('#result').html(gameText)

        if (players[turn] == 'bot') {
            setTimeout(() => RobotClick(), 300)
        }
    }    
}

function RobotClick() {
    let Bot = new Robot(turn, board)
    Bot.maxDepth = BotConfig[turn].maxDepth
    let result = Bot.getBestClick()
    turnHistory.push({ player: turn, click: result })
    board.click(turn, result.click)
    turn = (turn == 'x') ? 'o' : 'x'
    setTimeout(() => nextClick(), 1)
    return ''
}

function PlayerClick(index) {
    if (state != null || players[turn] != 'human') return 

    board.click(turn, index)
    turn = (turn == 'x') ? 'o' : 'x'
    nextClick()
    return ''
}

function renderGameBoard() {
    for (let i = 0; i < 9; i++)
    {
        $('#square' + i).html(board.state[i])
    }
}

for (let i = 0; i < 9; i++) {
    $('#square' + i).on('click', (e) => PlayerClick($(e.target).attr('id').split('square')[1]))
}